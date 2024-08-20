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

const getOrCreateFolder = async (folderName, parentId) =>  {
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
    const res = await driveService.files.list({
        q: query,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    } else {
        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
            driveId
        }

        const folder = await driveService.files.create({
            resource: folderMetadata,
            fields: 'id',
            supportsAllDrives: true,
        });

        return folder.data.id;
    }
}


const uploadFileToGoogleDrive = async (file, destinationPath) => {
    const folders = destinationPath.split('/');
    let parentId = driveId

    for (let i = 0; i < folders.length - 1; i++) {
        const folderName = folders[i];
        const folderId = await getOrCreateFolder(folderName, parentId);
        parentId = folderId;
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
        fields: 'id',
        supportsAllDrives: true,
    });

    return response.data.id;
}

module.exports = uploadFileToGoogleDrive