# YouTube Playlist Mover Extension

A Chrome extension that automates moving videos from your YouTube Watch Later playlist to another playlist of your choice.

## Features

- **Automated Processing**: Automatically moves videos from Watch Later to your chosen playlist
- **Progress Tracking**: Real-time progress bar showing how many videos have been processed
- **Playback Controls**: Start, Pause, Resume, and Stop the moving process at any time
- **Customizable Delay**: Set the delay between processing each video (1-10 seconds)
- **User-Friendly Interface**: Clean, intuitive popup interface

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the directory containing this extension

## Usage

1. Navigate to your YouTube Watch Later playlist at `https://www.youtube.com/playlist?list=WL`
2. Click the YouTube Playlist Mover extension icon in your browser toolbar
3. (Optional) Adjust the delay between videos in milliseconds (default: 2000ms)
4. Click the **Start** button to begin moving videos
5. The extension will:
   - Count the total number of videos
   - For each video:
     - Add it to the first available playlist (that's not Watch Later)
     - Remove it from Watch Later
   - Show progress in real-time

### Controls

- **Start**: Begin processing videos from Watch Later
- **Pause/Resume**: Temporarily pause the process and resume later
- **Stop**: Stop the process completely

## How It Works

The extension uses a content script that interacts with the YouTube Watch Later page. When started:

1. It identifies all videos in your Watch Later playlist
2. For each video, it:
   - Opens the video's action menu
   - Clicks "Add to playlist"
   - Selects the first available playlist (excluding Watch Later)
   - Removes the video from Watch Later
3. Repeats until all videos are processed or the user stops the operation

## Important Notes

- **Playlist Selection**: The extension automatically selects the first playlist in your "Add to playlist" dialog that is NOT Watch Later. Make sure you have at least one other playlist created.
- **Page Requirements**: You must have the Watch Later page open for the extension to work
- **Processing Speed**: A delay between videos is recommended to avoid rate limiting by YouTube
- **Browser Tab**: Keep the Watch Later tab active while the extension is running for best results

## Development

The extension consists of:

- `manifest.json` - Extension configuration
- `popup.html/css/js` - User interface for controlling the extension
- `content.js` - Script that interacts with the YouTube page
- `background.js` - Service worker for state management

## Privacy

This extension:
- Only runs on YouTube Watch Later pages
- Does not collect or transmit any user data
- Only interacts with YouTube's UI elements to move videos
- All operations are performed locally in your browser

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.