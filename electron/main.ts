import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "fs-extra";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Default settings structure
interface Settings {
	compressionQuality: number;
	outputDirectory: string;
	theme: "light" | "dark";
	zipAutoDownload: boolean;
	base64RemoveQualifier: boolean;
	base64CustomFormat: string;
	base64CopyAll: boolean;
}

const getSettingsPath = () =>
	path.join(app.getPath("userData"), "pixentia-settings.json");

const getDefaultSettings = (): Settings => ({
	compressionQuality: 80,
	outputDirectory: app.getPath("downloads"),
	theme: "dark",
	zipAutoDownload: false,
	base64RemoveQualifier: false,
	base64CustomFormat: "$base64",
	base64CopyAll: false,
});

// Helper for MIME types
const getMimeType = (ext: string): string => {
	const map: Record<string, string> = {
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".webp": "image/webp",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".bmp": "image/bmp",
		".ico": "image/x-icon",
		".tiff": "image/tiff",
		".avif": "image/avif",
		".pdf": "application/pdf",
		".mp4": "video/mp4",
		".webm": "video/webm",
		".mp3": "audio/mpeg",
		".wav": "audio/wav",
		".json": "application/json",
		".txt": "text/plain",
		".html": "text/html",
		".css": "text/css",
		".js": "application/javascript",
		".docx":
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xlsx":
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	};
	return map[ext.toLowerCase()] || "application/octet-stream";
};

const isImageFile = (ext: string): boolean => {
	const imageExts = [
		".jpg",
		".jpeg",
		".png",
		".webp",
		".gif",
		".bmp",
		".tiff",
		".avif",
		".svg",
		".ico",
	];
	return imageExts.includes(ext.toLowerCase());
};

async function createWindow() {
	let iconPath = fs.existsSync(path.join(__dirname, "../dist/icon.png"))
		? path.join(__dirname, "../dist/icon.png")
		: path.join(__dirname, "../public/icon.png");

	mainWindow = new BrowserWindow({
		width: 1280,
		height: 850,
		minWidth: 900,
		minHeight: 650,
		title: "Pixentia",
		icon: iconPath,
		backgroundColor: "#121214",
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	mainWindow.setMenuBarVisibility(false);
	mainWindow.setMenu(null);

	mainWindow.once("ready-to-show", () => {
		mainWindow?.show();
	});

	// Check if running in dev mode with Vite
	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		// mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
	}
}

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// ============================================================================
// IPC HANDLERS: SETTINGS & FOLDER SELECTION
// ============================================================================

ipcMain.handle("get-settings", async () => {
	try {
		const settingsPath = getSettingsPath();
		if (await fs.pathExists(settingsPath)) {
			const data = await fs.readJson(settingsPath);
			return { ...getDefaultSettings(), ...data };
		}
		const defaultSettings = getDefaultSettings();
		await fs.writeJson(settingsPath, defaultSettings, { spaces: 2 });
		return defaultSettings;
	} catch (error) {
		console.error("Error reading settings:", error);
		return getDefaultSettings();
	}
});

ipcMain.handle("save-settings", async (_, newSettings: Partial<Settings>) => {
	try {
		const settingsPath = getSettingsPath();
		let currentSettings = getDefaultSettings();
		if (await fs.pathExists(settingsPath)) {
			currentSettings = {
				...currentSettings,
				...(await fs.readJson(settingsPath)),
			};
		}
		const updated = { ...currentSettings, ...newSettings };
		await fs.writeJson(settingsPath, updated, { spaces: 2 });
		return { success: true, settings: updated };
	} catch (error: any) {
		console.error("Error saving settings:", error);
		return { success: false, error: error.message };
	}
});

ipcMain.handle("select-folder", async () => {
	if (!mainWindow) return null;
	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ["openDirectory", "createDirectory"],
		title: "Select Output Directory",
	});
	if (!result.canceled && result.filePaths.length > 0) {
		return result.filePaths[0];
	}
	return null;
});

// ============================================================================
// IPC HANDLERS: FILE SELECTION & METADATA
// ============================================================================

ipcMain.handle(
	"select-input-files",
	async (_, filters?: { name: string; extensions: string[] }[]) => {
		if (!mainWindow) return [];
		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ["openFile", "multiSelections"],
			filters: filters || [{ name: "All Files", extensions: ["*"] }],
			title: "Select Input Files",
		});

		if (result.canceled || result.filePaths.length === 0) return [];

		const files = [];
		for (const filePath of result.filePaths) {
			try {
				const stat = await fs.stat(filePath);
				if (stat.isFile()) {
					const parsed = path.parse(filePath);
					files.push({
						id: Math.random().toString(36).substring(2, 11),
						filePath,
						name: parsed.base,
						extension: parsed.ext,
						size: stat.size,
						isImage: isImageFile(parsed.ext),
						status: "idle",
					});
				}
			} catch (err) {
				console.error(`Error reading file stat for ${filePath}:`, err);
			}
		}
		return files;
	},
);

ipcMain.handle("get-file-metadata", async (_, filePaths: string[]) => {
	const files = [];
	for (const filePath of filePaths) {
		try {
			const stat = await fs.stat(filePath);
			if (stat.isFile()) {
				const parsed = path.parse(filePath);
				files.push({
					id: Math.random().toString(36).substring(2, 11),
					filePath,
					name: parsed.base,
					extension: parsed.ext,
					size: stat.size,
					isImage: isImageFile(parsed.ext),
					status: "idle",
				});
			}
		} catch (err) {
			console.error(`Error reading file stat for ${filePath}:`, err);
		}
	}
	return files;
});

// ============================================================================
// IPC HANDLERS: FEATURE 1 - IMAGE TO WEBP COMPRESSOR
// ============================================================================

ipcMain.handle(
	"compress-image",
	async (
		_,
		{
			filePath,
			quality,
			outputDir: _outputDir,
		}: { filePath: string; quality: number; outputDir: string },
	) => {
		try {
			const stat = await fs.stat(filePath);
			const originalSize = stat.size;
			const parsed = path.parse(filePath);

			// Use temp directory for initial compression to avoid polluting outputDir before download
			const tempDir = path.join(app.getPath("temp"), "pixentia_cache");
			await fs.ensureDir(tempDir);

			let outputPath = path.join(tempDir, `${parsed.name}.webp`);
			let counter = 1;
			while (await fs.pathExists(outputPath)) {
				outputPath = path.join(
					tempDir,
					`${parsed.name}_compressed_${counter}.webp`,
				);
				counter++;
			}

			const image = sharp(filePath);
			const metadata = await image.metadata();

			await image
				.webp({ quality: Number(quality) || 80, effort: 6 })
				.toFile(outputPath);

			const outStat = await fs.stat(outputPath);
			const compressedSize = outStat.size;
			const percentageChange = Number(
				(
					((compressedSize - originalSize) / originalSize) *
					100
				).toFixed(2),
			);

			return {
				success: true,
				originalSize,
				compressedSize,
				percentageChange,
				outputPath,
				width: metadata.width,
				height: metadata.height,
			};
		} catch (error: any) {
			console.error(`Compression error for ${filePath}:`, error);
			return {
				success: false,
				error: error.message || "Compression failed",
			};
		}
	},
);

ipcMain.handle(
	"save-download-file",
	async (
		_,
		{
			tempPath,
			outputDir,
			fileName,
		}: { tempPath: string; outputDir: string; fileName: string },
	) => {
		try {
			await fs.ensureDir(outputDir);
			let destPath = path.join(outputDir, fileName);
			let counter = 1;
			const parsed = path.parse(fileName);
			while (await fs.pathExists(destPath)) {
				destPath = path.join(
					outputDir,
					`${parsed.name}_${counter}${parsed.ext}`,
				);
				counter++;
			}
			await fs.copy(tempPath, destPath);
			return { success: true, destPath };
		} catch (error: any) {
			console.error("Download save error:", error);
			return { success: false, error: error.message };
		}
	},
);

ipcMain.handle(
	"create-zip",
	async (
		_,
		{
			files,
			outputDir,
			zipName,
		}: {
			files: { name: string; outputPath: string }[];
			outputDir: string;
			zipName?: string;
		},
	) => {
		try {
			await fs.ensureDir(outputDir);
			const finalZipName =
				zipName || `Pixentia_WebP_Batch_${Date.now()}.zip`;
			const zipPath = path.join(outputDir, finalZipName);

			const zip = new AdmZip();
			const addedNames = new Set<string>();

			for (const file of files) {
				if (file.outputPath && fs.existsSync(file.outputPath)) {
					const buffer = await fs.readFile(file.outputPath);
					
					const parsedOrig = path.parse(file.name);
					let targetName = `${parsedOrig.name}.webp`;
					let counter = 1;

					while (addedNames.has(targetName.toLowerCase())) {
						targetName = `${parsedOrig.name} (${counter}).webp`;
						counter++;
					}

					addedNames.add(targetName.toLowerCase());
					zip.addFile(targetName, buffer);
				}
			}

			zip.writeZip(zipPath);
			const stat = await fs.stat(zipPath);

			return {
				success: true,
				zipPath,
				totalBytes: stat.size,
			};
		} catch (error: any) {
			console.error("ZIP creation error:", error);
			return {
				success: false,
				error: error.message || "ZIP creation failed",
			};
		}
	},
);

// ============================================================================
// IPC HANDLERS: FEATURE 2 - ANY FILE TO BASE64
// ============================================================================

ipcMain.handle(
	"convert-base64",
	async (_, { filePath }: { filePath: string }) => {
		try {
			const buffer = await fs.readFile(filePath);
			const parsed = path.parse(filePath);
			const mimeType = getMimeType(parsed.ext);
			const base64Str = buffer.toString("base64");
			const fullBase64 = `data:${mimeType};base64,${base64Str}`;

			return {
				success: true,
				base64: fullBase64,
				mimeType,
				size: buffer.length,
			};
		} catch (error: any) {
			console.error(`Base64 conversion error for ${filePath}:`, error);
			return {
				success: false,
				error: error.message || "Base64 conversion failed",
			};
		}
	},
);

// ============================================================================
// IPC HANDLERS: FEATURE 3 - COMBINED MODE (PIPELINE)
// ============================================================================

ipcMain.handle(
	"run-combined-pipeline",
	async (
		_,
		{
			filePath,
			quality,
			outputDir: _outputDir,
		}: { filePath: string; quality: number; outputDir: string },
	) => {
		try {
			const parsed = path.parse(filePath);
			const isImg = isImageFile(parsed.ext);
			const stat = await fs.stat(filePath);
			const originalSize = stat.size;

			if (isImg) {
				// Step 1: Compress to WebP in temp cache
				const tempDir = path.join(
					app.getPath("temp"),
					"pixentia_cache",
				);
				await fs.ensureDir(tempDir);
				let outputPath = path.join(tempDir, `${parsed.name}.webp`);
				let counter = 1;
				while (await fs.pathExists(outputPath)) {
					outputPath = path.join(
						tempDir,
						`${parsed.name}_combined_${counter}.webp`,
					);
					counter++;
				}

				const image = sharp(filePath);
				const metadata = await image.metadata();

				await image
					.webp({ quality: Number(quality) || 80, effort: 6 })
					.toFile(outputPath);

				const outStat = await fs.stat(outputPath);
				const compressedSize = outStat.size;
				const percentageChange = Number(
					(
						((compressedSize - originalSize) / originalSize) *
						100
					).toFixed(2),
				);

				// Step 2: Convert compressed WebP to Base64
				const buffer = await fs.readFile(outputPath);
				const mimeType = "image/webp";
				const base64Str = buffer.toString("base64");
				const fullBase64 = `data:${mimeType};base64,${base64Str}`;

				return {
					success: true,
					wasCompressed: true,
					originalSize,
					compressedSize,
					percentageChange,
					outputPath,
					width: metadata.width,
					height: metadata.height,
					base64: fullBase64,
					mimeType,
				};
			} else {
				// Non-image file: just convert directly to Base64
				const buffer = await fs.readFile(filePath);
				const mimeType = getMimeType(parsed.ext);
				const base64Str = buffer.toString("base64");
				const fullBase64 = `data:${mimeType};base64,${base64Str}`;

				return {
					success: true,
					wasCompressed: false,
					originalSize,
					compressedSize: originalSize,
					percentageChange: 0,
					outputPath: filePath,
					base64: fullBase64,
					mimeType,
				};
			}
		} catch (error: any) {
			console.error(`Combined pipeline error for ${filePath}:`, error);
			return {
				success: false,
				error: error.message || "Combined pipeline failed",
			};
		}
	},
);
