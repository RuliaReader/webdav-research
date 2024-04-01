import { WebDavClient } from './webdav'

const sequenceEqual = (a1: ArrayLike<unknown>, a2: ArrayLike<unknown>) => {
  if (a1.length !== a2.length) {
    return false
  }

  for (let i = 0; i < a1.length; i++) {
    const b1 = a1[i]
    const b2 = a2[i]
    if (b1 !== b2) {
      return false
    }
  }

  return true
}

const getJpgPixelSize = async (filePath: string, webdav: WebDavClient): Promise<[number, number]> => {
  const JPG_HEADER_1 = [255, 216, 255, 224]
  const JPG_HEADER_2 = [255, 216, 255, 225]

  const headerBytes = new Uint8Array(await webdav.readBytes(filePath, 0, 4))
  const isEqual = sequenceEqual(JPG_HEADER_1, headerBytes) ||
    sequenceEqual(JPG_HEADER_2, headerBytes)

  if (!isEqual) {
    throw new Error('Not a jpg file')
  }

  let basePosition = 4
  const fileBytes = await webdav.getFileLength(filePath)
  while (basePosition < fileBytes) {
    const sectionLength = new DataView(await webdav.readBytes(filePath, basePosition, 2)).getUint16(0)
    const next = new DataView(await webdav.readBytes(filePath, basePosition + sectionLength + 1, 1)).getUint8(0)

    if (next === 0xC0 || next === 0xC1 || next === 0xC2) {
      const width = new DataView(
        await webdav.readBytes(filePath, basePosition + sectionLength + 5, 2)
      ).getUint16(0)
      const height = new DataView(
        await webdav.readBytes(filePath, basePosition + sectionLength + 7, 2)
      ).getUint16(0)
      return [width, height]
    }

    basePosition = basePosition + sectionLength + 2
  }

  return [-1, -1]
}

export {
  getJpgPixelSize
}
