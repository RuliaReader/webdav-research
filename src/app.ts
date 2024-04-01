import 'dotenv/config'

import { getJpgPixelSize } from './modules/test'
import { WebDavClient } from './modules/webdav'

const main = async () => {
  const webdav = new WebDavClient(
    process.env.WEBDAV_ENDPOINT as string,
    process.env.WEBDAV_USERNAME as string,
    process.env.WEBDAV_PASSWORD as string
  )

  await webdav.getDirectory('/')

  const jpgLength = await webdav.getFileLength('/Storage-SSD/test.jpg')
  console.log('JPG length:', jpgLength)

  const [width, height] = await getJpgPixelSize('/Storage-SSD/test.jpg', webdav)
  console.log('JPG size:', width, height)
}

main()
