import Meyda from 'meyda';
import { db } from '../db/database';

export class AudioEngine {
  private static instance: AudioEngine;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentFeatures: number[] = [];
  
  private isProcessing = false;
  private voiceprintTemplate: Float32Array | null = null;
  private similarityThreshold = 0.75;
  private noiseReductionLevel = 0.75;
  private analyzerInstance: any = null;
  private currentSimilarity = 1.0;
  private isMutedByVoiceprint = false;
  private gainNode: GainNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init() {
    if (this.audioContext) return;
    this.audioContext = new AudioContext({ sampleRate: 16000 });
  }

  public async startMicrophone() {
    await this.init();
    if (this.stream) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }});
      this.source = this.audioContext!.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext!.createAnalyser();
      this.analyser.fftSize = 512;
      
      this.gainNode = this.audioContext!.createGain();
      this.destination = this.audioContext!.createMediaStreamDestination();
      
      this.source.connect(this.analyser);
      this.source.connect(this.gainNode);
      this.gainNode.connect(this.destination);
      
      console.log('[AudioEngine] Microphone started');
    } catch (err) {
      console.error('[AudioEngine] Error accessing microphone:', err);
      throw err;
    }
  }

  public startRealTimeProcessing(onSimilarityUpdate?: (similarity: number, isMuted: boolean) => void) {
    if (this.isProcessing || !this.source || !this.voiceprintTemplate) return;
    this.isProcessing = true;

    this.analyzerInstance = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext!,
      source: this.source!,
      bufferSize: 512,
      featureExtractors: ['mfcc'],
      callback: (features: any) => {
        if (features && features.mfcc && this.voiceprintTemplate) {
          const similarity = AudioEngine.cosineSimilarity(features.mfcc, this.voiceprintTemplate);
          this.currentSimilarity = similarity;
          
          // Gate logic: if similarity < threshold, we "mute"
          this.isMutedByVoiceprint = similarity < this.similarityThreshold;
          
          if (this.gainNode && this.audioContext) {
            const targetGain = this.isMutedByVoiceprint ? 0 : 1;
            this.gainNode.gain.setTargetAtTime(targetGain, this.audioContext.currentTime, 0.05);
          }
          
          if (onSimilarityUpdate) {
            onSimilarityUpdate(similarity, this.isMutedByVoiceprint);
          }
        }
      }
    });

    this.analyzerInstance.start();
  }

  public stopRealTimeProcessing() {
    if (this.analyzerInstance) {
      this.analyzerInstance.stop();
      this.analyzerInstance = null;
    }
    this.isProcessing = false;
    this.isMutedByVoiceprint = false;
  }

  public stopMicrophone() {
    this.stopRealTimeProcessing();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  public getCurrentSimilarity() {
    return this.currentSimilarity;
  }

  public getIsMutedByVoiceprint() {
    return this.isMutedByVoiceprint;
  }

  public getProcessedStream(): MediaStream | null {
    return this.destination ? this.destination.stream : null;
  }

  public async recordVoiceprint(durationMs: number = 5000): Promise<Float32Array> {
    await this.startMicrophone();
    
    return new Promise((resolve) => {
      const allMfccs: number[][] = [];
      
      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: this.audioContext!,
        source: this.source!,
        bufferSize: 512,
        featureExtractors: ['mfcc'],
        callback: (features: any) => {
          if (features && features.mfcc) {
            allMfccs.push([...features.mfcc]);
          }
        }
      });

      analyzer.start();

      setTimeout(() => {
        analyzer.stop();
        // Compute average MFCC as the template
        const template = this.computeAverageMfcc(allMfccs);
        resolve(template);
      }, durationMs);
    });
  }

  private computeAverageMfcc(mfccs: number[][]): Float32Array {
    if (mfccs.length === 0) return new Float32Array(13);
    const numCoeffs = mfccs[0].length;
    const avg = new Float32Array(numCoeffs);
    
    for (let i = 0; i < numCoeffs; i++) {
        let sum = 0;
        for (let j = 0; j < mfccs.length; j++) {
            sum += mfccs[j][i];
        }
        avg[i] = sum / mfccs.length;
    }
    return avg;
  }

  public setVoiceprintTemplate(template: Float32Array | null) {
    this.voiceprintTemplate = template;
  }

  public setThreshold(threshold: number) {
    this.similarityThreshold = threshold;
  }

  public setNoiseReduction(level: number) {
    this.noiseReductionLevel = level;
  }

  public getRawWaveform(dataArray: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(dataArray);
      return true;
    }
    return false;
  }

  public getCleanWaveform(dataArray: Uint8Array) {
    // If filtering is active, we simulate the "cleaned" waveform based on raw + similarity
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(dataArray);
      
      // Basic simulation of filtering: if no template, or similarity low, mute it slightly for visualization
      // In a real system, this would be the output of the AudioWorklet
      if (this.voiceprintTemplate) {
        // This is a placeholder for real-time similarity check in viz
        // Real filtering happens in the audio path
      }
      return true;
    }
    return false;
  }

  public static cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const audioEngine = AudioEngine.getInstance();
