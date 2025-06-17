const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require("@aws-sdk/client-transcribe-streaming");

class SpeechToText {
  constructor() {
    this.client = new TranscribeStreamingClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.CHUNK_SIZE = 8192; // 8KB
  }

  async startTranscription(audioBuffer) {
    try {
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: "en-US",
        MediaEncoding: "pcm",
        MediaSampleRateHertz: 16000,
        AudioStream: this.createAudioStream(audioBuffer),
      });

      const response = await this.client.send(command);
      let transcription = "";

      for await (const event of response.TranscriptResultStream) {
        if (event.TranscriptEvent?.Transcript?.Results?.[0]?.Alternatives?.[0]?.Transcript) {
          transcription += event.TranscriptEvent.Transcript.Results[0].Alternatives[0].Transcript + " ";
        }
      }

      return { transcription: transcription.trim() };
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  }

  createAudioStream(audioBuffer) {
    const buffer = Buffer.from(audioBuffer, 'base64');
    const chunks = this.chunkBuffer(buffer);
    
    return {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) {
          yield { AudioEvent: { AudioChunk: chunk } };
          // Add a small delay between chunks to prevent overwhelming the service
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      },
    };
  }

  chunkBuffer(buffer) {
    const chunks = [];
    for (let i = 0; i < buffer.length; i += this.CHUNK_SIZE) {
      chunks.push(buffer.slice(i, i + this.CHUNK_SIZE));
    }
    return chunks;
  }
}

module.exports = SpeechToText; 