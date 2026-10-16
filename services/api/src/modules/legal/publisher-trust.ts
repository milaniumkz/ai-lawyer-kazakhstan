import {X509Certificate} from 'node:crypto';
import {request} from 'node:https';
import {Readable} from 'node:stream';

// Public CA certificates downloaded with normal HTTPS validation from
// https://pki.gov.kz/cert/root_rsa_2020.cer and /cert/nca_rsa_2022.cer.
// Never install these roots globally: they apply only to the exact publishers below.
const root = new X509Certificate(Buffer.from('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','base64'));
const issuer = new X509Certificate(Buffer.from('MIIGzTCCBLWgAwIBAgIUXK4k10myZIDS3jcjPD6kUV21WscwDQYJKoZIhvcNAQELBQAwVDFFMEMGA1UEAww80J3QldCT0IbQl9CT0IYg0JrQo9OY0JvQkNCd0JTQq9Cg0KPQqNCrINCe0KDQotCQ0JvQq9KaIChSU0EpMQswCQYDVQQGEwJLWjAeFw0yMjA5MjIxMDM4MTVaFw00NTA5MDcxMDA0NTRaMFcxSDBGBgNVBAMMP9Kw0JvQotCi0KvSmiDQmtCj05jQm9CQ0J3QlNCr0KDQo9Co0Ksg0J7QoNCi0JDQm9Cr0pogKFJTQSkgMjAyMjELMAkGA1UEBhMCS1owggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCTD1fMTy3RQ1I4UN69sui+NDDH1DYK5tZySHeNIFW0wYZbRUypPuPvc5NMIAqMoyXhJH/QpPe4HdAMyPaU6vu0ie5e+QO504ABmDPL0ANCM7xADH8VC06K2pnVucK4ipenUte3hctZv8JM4F3I6jcZXh4pa7qTOsGp2liUh5o4mOXKakYnnZOCyDInoPzyyBRsUMMJogkH/jOSzQ0gwx26rOGfC9UlmNaKwc/gy49Asfl7tFCnZKFgYust0XPBrr9wj3JrNNw2G7GtmYaS7pI3TRaLF1ErDOz6IzCRkXavclhMIeCz8RpIgAkaDB5BIuN9Cv3kDM4oW0k3EoGrD7ZE+ikAxeHZgRa0tGMo3l6Y6G5LPOqfVlrsHeLQZh/Pn5bdCxNKmsMYvnrHyx3SbBHoQ5vga7oXrax2JlZU9hOEZyeCk+ybQ9hqAyhAVlDIcnMrfSQatEEtcorGUMHUM2nuRteAlQ7yhG4abfyDGqYwgCmsvApKEAcKlXcFsjgAgduFvZb9MEUnKr1zDJy8UQnGefLzow/fSaRNGUbdoOjzjpBhy05UbVwVzCz4D3D1YnCTkNtNU4vK6hxZcKMz+/SHVYox5/CXXmzfffDwM8pqLpn8EZSghvbpbPLRExQf/817z2/vgOu8slAP5r6J83+6PLMN8YMoSxeYyseJybTB0QIDAQABo4IBkjCCAY4wEgYDVR0TAQH/BAgwBgEB/wIBADAOBgNVHQ8BAf8EBAMCAQYwMwYDVR0fBCwwKjAooCagJIYiaHR0cDovL2NybC5yb290Lmdvdi5rei9yc2EyMDIwLmNybDAdBgNVHQ4EFgQU3K4k10myZIDS3jcjPD6kUV21WscwgZEGA1UdIwSBiTCBhoAUVLO3QNRbkXB77Uor5Bt7afj2ulChWKRWMFQxRTBDBgNVBAMMPNCd0JXQk9CG0JfQk9CGINCa0KPTmNCb0JDQndCU0KvQoNCj0KjQqyDQntCg0KLQkNCb0KvSmiAoUlNBKTELMAkGA1UEBhMCS1qCFFSzt0DUW5Fwe+1KK+Qbe2n49rpQMEUGCCsGAQUFBwEBBDkwNzA1BggrBgEFBQcwAoYpaHR0cDovL3Jvb3QuZ292Lmt6L2NlcnQvcm9vdF9yc2FfMjAyMC5jZXIwOQYDVR0gBDIwMDAuBgYqgw4DAwIwJDAiBggrBgEFBQcCARYWIGh0dHA6Ly9wa2kuZ292Lmt6L2NwczANBgkqhkiG9w0BAQsFAAOCAgEAFkZsWWJyxnDdvjMVBo/98GRZVaiA1Tm+3KM7RiKLhkcEJ8xjIztXfCZ/Ojz3sXHvvDrDOV9RkIbKRW7CVbDg5vnsj+nLqvuFLWC7vg9MQbHduvb7j3r7UG5zUBnd3hk5hgU2vLYx5tbcq67yyLthjrNViKsm09gAYNjEfQmIDFAgqChJaL7QyY4gtvMPmvqzlp5hlORgU7bK70RlDp5He3rJCu1+UKDXFgpwUgonPlfZlI8pVpDb9+D4NcTrZ3XB6N9luCk0NSDwCbBlE4sKpwxIQRJJt700sQ8GUZQ0qld70XIHVT/Nvr3ftda/Z1UvJK2+aCAZi19kS7+MzAn8zcLNsF68N59h7rzdkarFqEoSKxVJycs4gja2ysGD2pMMUeL1vUph+oOUr3lQIMwAHZo1YMtkQqUPyHsJTugHijK1B5JbIbjiFeRkK15y6rAexpdaTqLiI3oGYOfJC4MDmUKO9FIlUpw9eWfOqZ/KA9rlhIRaygNpIYHwBRI/adSaEhiWr8IWa2YTUv3vMMyOKXEXdKV+G26E2CBVRGvmOfTJDETvixG9kpNZmWKe+l/NdHmQQvpsBSvJmSl42mb9Od8aRx651BTxEVIHc+UGrVLBHwBCpTlGyEDmAKQOCfGtX9Hhri1h8P5PleqDWdEw7BvZf1Qn+VM8iNU1rkEBK7w=','base64'));

export function publisherTrust(url:string) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !['law.gov.kz','zan.gov.kz','senate.parlam.kz','mazhilis.parlam.kz'].includes(parsed.hostname) || (parsed.port && parsed.port !== '443')) return undefined;
  const valid = [root,issuer].every(cert=>cert.ca && Date.parse(cert.validFrom)<=Date.now() && Date.parse(cert.validTo)>Date.now());
  if (!valid || root.fingerprint256 !== '9B:A0:63:54:B6:26:64:17:15:18:2E:4D:07:C9:DB:AA:17:77:72:0F:A7:95:D0:31:74:FF:C6:88:76:53:5D:CD' || issuer.fingerprint256 !== '84:FB:79:9A:66:14:09:50:81:8C:05:6A:5D:97:30:AC:C2:A7:62:2C:DD:4E:F0:D4:71:13:B1:32:FB:89:29:05' || !root.verify(root.publicKey) || !issuer.checkIssued(root) || !issuer.verify(root.publicKey)) return undefined;
  return {ca:[root.toString(),issuer.toString()],rejectUnauthorized:true as const};
}

export async function fetchOfficialPublisher(url:string,options:{redirect:'manual';signal:AbortSignal;method?:'GET'|'POST';headers?:Record<string,string>;body?:string}):Promise<Response> {
  try {return await fetch(url,options);}
  catch(error) {
    const code=(error as {cause?:{code?:string}})?.cause?.code;
    const trust=publisherTrust(url);
    if (!trust || !['UNABLE_TO_VERIFY_LEAF_SIGNATURE','UNABLE_TO_GET_ISSUER_CERT_LOCALLY','SELF_SIGNED_CERT_IN_CHAIN'].includes(code || '')) throw error;
    return new Promise((resolve,reject)=>{
      const req=request(url,{...trust,signal:options.signal,method:options.method || 'GET',headers:options.headers},response=>{
        const headers=new Headers();
        for(const [key,value] of Object.entries(response.headers)) if(value!==undefined) headers.set(key,Array.isArray(value) ? value.join(', ') : value);
        const status=response.statusCode || 502;
        resolve(new Response([204,205,304].includes(status) ? null : Readable.toWeb(response) as ReadableStream<Uint8Array>,{status,headers}));
      });
      req.on('error',reject);req.end(options.body);
    });
  }
}
