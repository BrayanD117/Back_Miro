const { drive } = require('@googleapis/drive')
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const driveId = process.env.DRIVE_ID

const auth = new GoogleAuth({
    keyFile: path.join(__dirname, '../google-credentials.json'),
    scopes: 'https://www.googleapis.com/auth/drive'
  });
  
const driveService = drive({
    version: 'v3',
    auth: auth
});

const folderCache = new Map();

const getOrCreateFolder = async (folderName, parentId) =>  {
    const cacheKey = `${parentId}-${folderName}`;
    if (folderCache.has(cacheKey)) {
        return folderCache.get(cacheKey);
    }

    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
    const res = await driveService.files.list({
        q: query,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    let folderId;
    if (res.data.files.length > 0) {
        folderId = res.data.files[0].id;
    } else {
        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        };

        const folder = await driveService.files.create({
            resource: folderMetadata,
            fields: 'id',
            supportsAllDrives: true,
        });

        folderId = folder.data.id;
    }

    folderCache.set(cacheKey, folderId);
    return folderId;
};



const uploadFileToGoogleDrive = async (file, destinationPath) => {
    const folders = destinationPath.split('/');
    let parentId = driveId

    for (let i = 0; i < folders.length - 1; i++) {
        parentId = await getOrCreateFolder(folders[i], parentId);
    }

    const fileMetadata = {
        name: folders[folders.length - 1],
        parents: [parentId],
        driveId, 
        supportsAllDrives: true,
    };

    const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path)
    };

    const response = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
        supportsAllDrives: true,
    });

    return {id:response.data.id, webViewLink: response.data.webViewLink}
}

const uploadFilesToGoogleDrive = async (files, destinationPath) => {
    const uploadPromises = files.map((file) => uploadFileToGoogleDrive(file, destinationPath));
    const fileIds = await Promise.all(uploadPromises);
    return fileIds;
  };

module.exports = {uploadFileToGoogleDrive};