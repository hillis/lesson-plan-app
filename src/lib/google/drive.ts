import { google } from 'googleapis'

export function createDriveClient(
  accessToken: string,
  refreshToken?: string | null,
  onTokenRefresh?: (tokens: { access_token?: string | null; refresh_token?: string | null }) => void
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (onTokenRefresh) {
    oauth2Client.on('tokens', (tokens) => {
      onTokenRefresh(tokens)
    })
  }

  return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function createFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string
) {
  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id, webViewLink',
  })

  return {
    id: response.data.id!,
    url: response.data.webViewLink!,
  }
}

export async function uploadFile(
  drive: ReturnType<typeof google.drive>,
  name: string,
  content: Buffer,
  mimeType: string,
  folderId: string
) {
  const response = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: require('stream').Readable.from(content),
    },
    fields: 'id, webViewLink',
  })

  return {
    id: response.data.id!,
    url: response.data.webViewLink!,
  }
}

export async function listFolders(
  drive: ReturnType<typeof google.drive>,
  parentId?: string
) {
  const query = parentId
    ? `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    : `mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false`

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    orderBy: 'name',
  })

  return response.data.files || []
}
