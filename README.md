# YouTube Resolution Controller

A Chrome extension that automatically sets and maintains your preferred video resolution on YouTube.

## Features

- 🎥 Automatically sets video resolution without manual intervention
- ⚡ Fast and efficient resolution changes using YouTube's internal API
- 💾 Saves your preferred resolution across browser sessions
- 🎨 Modern, clean user interface
- 🔄 Works on all YouTube videos, including newly opened tabs
- 🎯 Supports resolutions from 144p to 4K (2160p)

## Supported Resolutions

- 2160p (4K Ultra HD)
- 1440p (2K Quad HD)
- 1080p (Full HD)
- 720p (HD)
- 480p (SD)
- 360p
- 240p
- 144p

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your Chrome toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. Select your preferred resolution from the dropdown menu
3. The setting will be automatically applied to all YouTube videos
4. Your preference will be saved and maintained across browser sessions

## Technical Details

### Project Structure

```
├── manifest.json      # Extension configuration
├── popup.html        # Extension popup interface
├── popup.js          # Popup functionality
├── content.js        # YouTube page interaction
└── styles.css        # Styling
```

### Key Components

- **manifest.json**: Defines extension properties and permissions
- **popup.html/js**: User interface for resolution selection
- **content.js**: Handles YouTube video resolution changes
- **styles.css**: Modern UI styling

### Technologies Used

- HTML5
- CSS3 (with modern features)
- JavaScript (ES6+)
- Chrome Extension APIs
- YouTube Player API

## Features in Detail

### Automatic Resolution Control
- Uses YouTube's internal API for direct resolution control
- No manual clicking required
- Works on all YouTube videos automatically

### User Interface
- Clean, modern design
- Responsive layout
- Smooth animations
- Material Design-inspired components
- Custom-styled dropdowns

### Performance
- Lightweight implementation
- Minimal impact on page load
- Efficient resolution switching

## Development

### Prerequisites
- Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Building
1. Clone the repository
2. Make your modifications
3. Load the extension in Chrome as described in Installation

### Testing
1. Open YouTube
2. Select different resolutions
3. Verify the changes are applied automatically
4. Check if the setting persists across page reloads

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YouTube Player API
- Material Icons
- Inter font family

## Support

For support, please open an issue in the GitHub repository.