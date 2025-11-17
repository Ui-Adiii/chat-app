import multer from 'multer';
import {v4 as uuid} from 'uuid';
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, uuid())
  }
})

const upload = multer({ storage: storage })
export default upload