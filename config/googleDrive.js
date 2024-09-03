const { drive } = require("@googleapis/drive");
const { GoogleAuth } = require("google-auth-library");
const fs = require("fs");
const path = require("path");

const driveId = process.env.DRIVE_ID;

const auth = new GoogleAuth({
  keyFile: path.join(__dirname, "../google-credentials.json"),
  scopes: "https://www.googleapis.com/auth/drive",
});

const driveService = drive({
  version: "v3",
  auth: auth,
});

const folderCache = new Map();

const getOrCreateFolder = async (folderName, parentId) => {
  const cacheKey = `${parentId}-${folderName}`;

  // Revisa si la carpeta ya está en la caché
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey);
  }

  // Realiza la búsqueda de la carpeta en Google Drive
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const res = await driveService.files.list({
    q: query,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  let folderId;

  // Si la carpeta existe, obten el ID
  if (res.data.files.length > 0) {
    folderId = res.data.files[0].id;
  } else {
    // Si no existe, crea la carpeta
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    };

    const folder = await driveService.files.create({
      resource: folderMetadata,
      fields: "id",
      supportsAllDrives: true,
    });

    folderId = folder.data.id; // Asigna el ID del folder creado
  }

  // Almacena el folderId en la caché
  folderCache.set(cacheKey, folderId);

  return folderId;
};

const mutex = {};
const getOrCreateFolderWithLock = async (folderName, parentId) => {
  const key = `${parentId}/${folderName}`;
  if (!mutex[key]) {
    mutex[key] = new Promise(async (resolve, reject) => {
      try {
        const folderId = await getOrCreateFolder(folderName, parentId);
        resolve(folderId);
      } catch (error) {
        reject(error);
      } finally {
        delete mutex[key]; // Libera el lock después de la ejecución
      }
    });
  }
  return mutex[key];
};

const uploadFileToGoogleDrive = async (file, destinationPath, name) => {
  const folders = destinationPath.split("/");
  let parentId = driveId;
  console.log(Buffer.from(name, "utf8").toString());
  let ancestorId;

  const files = await driveService.files.get({
    fileId: "1Vjmmc-W-36ZRArgzs0jAm9g-yIBWrqcJ",
    fields: "parents",
  });

  console.log(files.data.parents);

  for (let i = 0; i < folders.length; i++) {
    parentId = await getOrCreateFolderWithLock(folders[i], parentId);
    if (i === folders.length - 2) {
      ancestorId = parentId;
    }
  }

  const fileMetadata = {
    name: Buffer.from(name, "latin1").toString("utf8"),
    parents: [parentId],
    driveId,
    supportsAllDrives: true,
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const response = await driveService.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, name, webViewLink, webContentLink, parents",
    supportsAllDrives: true,
  });

  return { ...response.data, reportFolderId: ancestorId };
};

const uploadFilesToGoogleDrive = async (files, destinationPath) => {
  const folders = destinationPath.split("/");
  let parentId = driveId;

  // Asegúrate de que la carpeta destino esté creada antes de cargar los archivos
  for (let i = 0; i < folders.length; i++) {
    parentId = await getOrCreateFolderWithLock(folders[i], parentId);
  }

  const uploadPromises = files.map((file) =>
    uploadFileToGoogleDrive(file, destinationPath, file.originalname)
  );
  const filesData = await Promise.all(uploadPromises);
  return filesData;
};

const updateFileInGoogleDrive = async (fileId, file, newFileName) => {
  try {
    const fileMetadata = {
      name: Buffer.from(newFileName, "latin1").toString("utf8"), // Actualizar el nombre si es necesario
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const response = await driveService.files.update({
      fileId: fileId,
      resource: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, webContentLink",
      supportsAllDrives: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error updating file:", error);
    throw error;
  }
};

const moveDriveFolder = async (folderId, destinationPath) => {
  const folders = destinationPath.split("/");
  let newParentId = driveId;
  let ancestorId;

  for (let i = 0; i < folders.length - 1; i++) {
    newParentId = await getOrCreateFolderWithLock(folders[i], newParentId);
    if (i === folders.length - 3) {
      ancestorId = newParentId;
    }
  }

  const file = await driveService.files.get({
    fileId: folderId,
    fields: 'parents',
    supportsAllDrives: true,
  });

  const currentParents = file.data.parents;

  await driveService.files.update({
    fileId: folderId,
    name: folders[folders.length - 1],
    addParents: newParentId,
    removeParents: currentParents.join(','),
    fields: "parents",
    supportsAllDrives: true,
  });

  return ancestorId;
};

const deleteDriveFile = async (fileId) => {
  try {
    await driveService.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
  }
};

const deleteDriveFiles = async (fileIds) => {
  try {
    const deletePromises = fileIds.map((fileId) => deleteDriveFile(fileId));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting files:", error);
  }
};

module.exports = {
  uploadFileToGoogleDrive,
  uploadFilesToGoogleDrive,
  moveDriveFolder,
  deleteDriveFiles,
  updateFileInGoogleDrive
};
