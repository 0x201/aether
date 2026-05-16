import CryptoJS from 'crypto-js'

/**
 * 计算文件的Hash值
 * @param file 文件对象
 * @param algorithm 算法名称
 * @param onProgress 进度回调函数
 * @returns Promise<string> 返回Hash值
 */
export const calculateFileHash = (
  file: File,
  algorithm: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 如果文件为空，直接返回空Hash
    if (file.size === 0) {
      resolve(getEmptyHash(algorithm))
      return
    }

    // 根据算法创建对应的Hash实例
    const hasher = createHasher(algorithm)

    if (!hasher) {
      reject(new Error(`不支持的算法: ${algorithm}`))
      return
    }

    // 分片大小，例如 5MB
    const chunkSize = 5 * 1024 * 1024
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0

    const fileReader = new FileReader()

    // 定义加载下一个分片的函数
    const loadNext = () => {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)

      fileReader.readAsArrayBuffer(file.slice(start, end))
    }

    // 当分片读取完成时
    fileReader.addEventListener('load', (e) => {
      // 将 ArrayBuffer 转换为 WordArray
      const arrayBuffer = e.target?.result as ArrayBuffer
      if (!arrayBuffer) {
        reject(new Error('无法读取文件分片'))
        return
      }

      const uint8Array = new Uint8Array(arrayBuffer)
      const wordArray = arrayBufferToWordArray(uint8Array)

      // 更新Hash器
      hasher.update(wordArray)

      // 更新进度
      currentChunk++
      if (onProgress) {
        onProgress(currentChunk * chunkSize, file.size)
      }

      if (currentChunk < chunks) {
        // 加载下一个分片
        loadNext()
      } else {
        // 所有分片处理完成，计算最终Hash
        try {
          const hashResult = hasher.finalize()
          resolve(hashResult.toString())
        } catch (error) {
          reject(error)
        }
      }
    })

    // 处理读取错误
    fileReader.addEventListener('error', () => {
      reject(new Error('读取文件时发生错误'))
    })

    // 开始读取第一个分片
    loadNext()
  })
}

/**
 * 创建对应算法的Hash器
 * @param algorithm 算法名称
 * @returns 对应的Hash器实例或null
 */
const createHasher = (algorithm: string) => {
  switch (algorithm.toUpperCase()) {
    case 'MD5':
      return CryptoJS.algo.MD5.create()
    case 'SHA1':
      return CryptoJS.algo.SHA1.create()
    case 'SHA256':
      return CryptoJS.algo.SHA256.create()
    case 'SHA512':
      return CryptoJS.algo.SHA512.create()
    case 'RIPEMD160':
      return CryptoJS.algo.RIPEMD160.create()
    default:
      return null
  }
}

/**
 * 获取空数据的Hash值
 * @param algorithm 算法名称
 * @returns 空数据的Hash值
 */
const getEmptyHash = (algorithm: string): string => {
  switch (algorithm.toUpperCase()) {
    case 'MD5':
      return CryptoJS.MD5('').toString()
    case 'SHA1':
      return CryptoJS.SHA1('').toString()
    case 'SHA256':
      return CryptoJS.SHA256('').toString()
    case 'SHA512':
      return CryptoJS.SHA512('').toString()
    case 'RIPEMD160':
      return CryptoJS.RIPEMD160('').toString()
    default:
      return ''
  }
}

/**
 * 将ArrayBuffer转换为CryptoJS的WordArray
 * @param input Uint8Array
 * @returns CryptoJS WordArray
 */
const arrayBufferToWordArray = (input: Uint8Array): CryptoJS.lib.WordArray => {
  const len = input.length

  if (!input || len === 0) {
    return CryptoJS.lib.WordArray.create([], 0)
  }

  const wordCount = Math.ceil(len / 4)
  const words = Array(wordCount).fill(0)

  for (let i = 0; i < len; i++) {
    const index = i >>> 2
    const byte = input[i]!
    words[index] |= (byte & 0xff) << (24 - (i % 4) * 8)
  }

  return CryptoJS.lib.WordArray.create(words, len)
}
