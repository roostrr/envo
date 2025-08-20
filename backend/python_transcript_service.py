from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

app = Flask(__name__)

@app.route('/get-transcript')
def get_transcript():
    video_id = request.args.get('videoId')
    if not video_id:
        return jsonify({'error': 'Missing videoId'}), 400
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            transcript = transcript_list.find_transcript(['en', 'es', 'fr', 'de', 'it', 'pt'])
            transcript = transcript.translate('en')
        transcript_data = transcript.fetch()
        formatted_text = ""
        for entry in transcript_data:
            formatted_text += entry['text'] + " "
        return jsonify({'transcript': formatted_text.strip()})
    except (TranscriptsDisabled, NoTranscriptFound):
        return jsonify({'transcript': ''})
    except Exception as e:
        print(f"Transcript error for {video_id}: {e}")
        return jsonify({'transcript': '', 'error': str(e)}), 200

if __name__ == '__main__':
    app.run(port=5002) 