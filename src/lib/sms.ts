import Dysmsapi20170525, * as $Dysmsapi20170525 from "@alicloud/dysmsapi20170525";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";

function createClient(): Dysmsapi20170525 {
  const config = new $OpenApi.Config({
    accessKeyId: process.env.SMS_ACCESS_KEY_ID,
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET,
    endpoint: "dysmsapi.aliyuncs.com",
    regionId: process.env.SMS_REGION_ID || "cn-hangzhou",
  });
  return new Dysmsapi20170525(config);
}

export async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  try {
    const client = createClient();
    const request = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: process.env.SMS_SIGN_NAME,
      templateCode: process.env.SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code }),
    });
    const runtime = new $Util.RuntimeOptions({});
    const result = await client.sendSmsWithOptions(request, runtime);
    return result.body?.code === "OK";
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}
