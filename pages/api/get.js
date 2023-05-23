import { getRekognitionClient } from '../../helpers/rekognition';

export default async function handler(req, res) {
    const rekognition = await getRekognitionClient();
    const response = await rekognition.getFaceLivenessSessionResults({
        SessionId: req.query.sessionId,
    }).promise();
    
    const isLive = response.Confidence > 90;
    
    res.status(200).json({
        isLive,
    });
}