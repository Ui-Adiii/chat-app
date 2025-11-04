import mongoose from "mongoose";
const connectDB = async () => {
  mongoose
    .connect(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME,
    })
    .then(() => console.log("database connected successfully"))
    .catch((err) => {console.log(err)
        process.exit(1);
    });
};

export default connectDB;