declare module "ali-oss" {
  interface OSSOptions {
    region?: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket?: string;
    endpoint?: string;
    cname?: boolean;
  }

  interface PutResult {
    url: string;
    name: string;
    res: { status: number };
  }

  class OSS {
    constructor(options: OSSOptions);
    put(name: string, file: Buffer | string): Promise<PutResult>;
    delete(name: string): Promise<{ res: { status: number } }>;
    signatureUrl(name: string, options?: { expires?: number }): string;
  }

  export default OSS;
}
