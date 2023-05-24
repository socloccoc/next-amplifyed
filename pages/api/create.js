import { getRekognitionClient } from '../../helpers/rekognition';

export default async function handler(req, res) {
    const rekognition = await getRekognitionClient();
    const response = await rekognition.createFaceLivenessSession().promise();
    
    res.status(200).json({
        sessionId: response.SessionId,
    });
}