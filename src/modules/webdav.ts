import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

const proxyUrl = process.env.PROXY_URL as string
const proxy = new HttpsProxyAgent(proxyUrl)

class WebDavClient {
  private readonly baseUrl: string
  private readonly username: string
  private readonly password: string

  private createAuthHeaderValue (): string {
    return 'Basic ' + btoa(this.username + ':' + this.password)
  }

  private sendRequest (params: {
    path: string,
    method: string
    headers?: Record<string, string>
  }) {
    const { path, method } = params
    const url = this.baseUrl + path

    const headers = new Headers()
    if (this.username && this.password) {
      headers.append('Authorization', this.createAuthHeaderValue())
    }

    if (params.headers) {
      for (const [key, value] of Object.entries(params.headers)) {
        headers.append(key, value)
      }
    }

    return fetch(url, {
      method,
      headers,
      agent: proxy
    })
  }

  getDirectory (path: string) {
    return this.sendRequest({
      path,
      headers: {
        Depth: '1'
      },
      method: 'PROPFIND'
    }).then(response => response.text())
  }

  getFileLength (path: string): Promise<number> {
    return this.sendRequest({
      method: 'HEAD',
      path
    }).then(response => {
      const length = response.headers.get('Content-Length')
      return typeof length === 'string' ? parseInt(length) : 0
    })
  }

  readBytes (path: string, position: number, length: number): Promise<ArrayBuffer> {
    return this.sendRequest({
      path,
      method: 'GET',
      headers: {
        Range: `bytes=${position}-${position + length - 1}`
      }
    }).then(item => item.arrayBuffer())
  }

  constructor (
    baseUrl: string,
    username: string,
    password: string
  ) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password
  }
}

export {
  WebDavClient
}
