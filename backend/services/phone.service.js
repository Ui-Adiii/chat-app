import twilio from 'twilio';
const account_sid = process.env.TWILIO_ACCOUNT_SID;
const auth_token = process.env.TWILIO_AUTH_TOKEN;
const service_sid=process.env.TWILIO_SERVICE_SID;

const client = twilio(account_sid,auth_token);

const  sendOtpToPhoneNumber = async (phoneNumber) => {
    try {
        console.log('sending to '+phoneNumber);
        if(!phoneNumber){
            return new Error('phone number is required');
        }

        const response = await client.verify.v2.services(service_sid).verifications.create({
            to:phoneNumber,
            channel:"sms"
        })
        console.log(response)
        return response;
        
    } catch (error) {
        console.log(error.message);
        throw new Error(error.message);
    }    
}


const  verifyOtpService = async (phoneNumber,otp) => {
    try {
        console.log(otp,phoneNumber)
        const response = await client.verify.v2.services(service_sid).verificationChecks.create({
            to:phoneNumber,
            code:otp
        })
        console.log(response)
        return response;
    } catch (error) {
        console.log(error.message);
        throw new Error(error.message);
    }    
}

export {sendOtpToPhoneNumber,verifyOtpService}