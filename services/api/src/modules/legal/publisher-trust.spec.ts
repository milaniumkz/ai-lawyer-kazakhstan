import {X509Certificate} from 'node:crypto';
import {publisherTrust,fetchOfficialPublisher} from './publisher-trust';

describe('official publisher trust boundary',()=>{
  afterEach(()=>jest.restoreAllMocks());
  it('uses a cryptographically verified official NCA chain only for the two exact HTTPS publishers',()=>{
    const trust=publisherTrust('https://zan.gov.kz/client/#!/doc/1/rus');
    expect(trust?.rejectUnauthorized).toBe(true);
    const [root,issuer]=trust!.ca.map(pem=>new X509Certificate(pem));
    expect(issuer.verify(root.publicKey)).toBe(true);
    expect(publisherTrust('https://law.gov.kz/')).toBeDefined();
    for(const url of ['https://api.openai.com/','https://gov.kz/','http://zan.gov.kz/','https://zan.gov.kz.evil.invalid/','https://evil.zan.gov.kz/','https://zan.gov.kz:8443/','https://user:password@zan.gov.kz/']) expect(publisherTrust(url)).toBeUndefined();
  });
  it('does not retry timeouts, hostname mismatch, or other transports with the national CA',async()=>{
    for(const code of ['ERR_TLS_CERT_ALTNAME_INVALID','CERT_HAS_EXPIRED','ECONNRESET']) {
      const error=Object.assign(new TypeError('synthetic'),{cause:{code}});
      const fetch=jest.spyOn(global,'fetch').mockRejectedValueOnce(error);
      await expect(fetchOfficialPublisher('https://zan.gov.kz/',{redirect:'manual',signal:new AbortController().signal})).rejects.toBe(error);
      expect(fetch).toHaveBeenCalledTimes(1);jest.restoreAllMocks();
    }
  });
});
