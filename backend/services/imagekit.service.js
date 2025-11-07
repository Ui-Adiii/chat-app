import ImageKit from "imagekit";
import {v4 as uuid} from 'uuid';
import fs from 'fs';
const imagekitService =  new ImageKit({
    publicKey  : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});
const uploadFileImageKit = async (file)=>{
    const result = await imagekitService.upload({
            file:fs.readFileSync(file.path),
            fileName :uuid()
        });
  
    return result.url
}
export default uploadFileImageKit