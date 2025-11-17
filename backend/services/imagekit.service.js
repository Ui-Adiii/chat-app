import { v4 as uuid } from "uuid";
import fs from "fs";
import imagekitService from "../config/imagekit.config.js";

const uploadFileImageKit = async (file) => {
  const result = await imagekitService.upload({
    file: fs.readFileSync(file.path),
    fileName: uuid(),
  });

  return result.url;
};
export default uploadFileImageKit;
