import OSS from "ali-oss";

export function getOSSClient() {
  return new OSS({
    region: "oss-cn-shenzhen",
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET || "chorify-nova",
    endpoint: process.env.OSS_ENDPOINT || "oss-cn-shenzhen.aliyuncs.com",
    cname: !!process.env.OSS_CNAME,
  });
}

export function generateOSSKey(fileName: string): string {
  const date = new Date();
  const prefix = `file-transfer/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}/${random}_${fileName}`;
}
