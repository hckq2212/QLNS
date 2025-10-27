// utils/cloudinaryDownload.js
import { v2 as cloudinary } from 'cloudinary'
import crypto from 'crypto'

export default function generateDownloadUrl(publicId, options = {}) {
  const {
    type = 'upload',
    attachment = true,
    target_filename,
  } = options

  const timestamp = Math.floor(Date.now() / 1000)

  // Tham số ký (theo đúng thứ tự)
  const paramsToSign = {
    attachment,
    public_id: publicId,
    target_filename,
    timestamp,
    type,
  }

  // Tạo stringToSign
  const stringToSign = Object.keys(paramsToSign)
    .filter(k => paramsToSign[k] !== undefined)
    .sort()
    .map(k => `${k}=${paramsToSign[k]}`)
    .join('&')

  const signature = crypto
    .createHash('sha1')
    .update(stringToSign + cloudinary.config().api_secret)
    .digest('hex')

  // Tạo query string
  const query = new URLSearchParams({
    ...paramsToSign,
    api_key: cloudinary.config().api_key,
    signature,
  }).toString()

  return `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/raw/download?${query}`
}
