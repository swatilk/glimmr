# 🌟 Glimmr - AI-Powered Beauty & Style Assistant

> Complete your perfect look with AI-powered beauty and styling recommendations

## ✨ What is Glimmr?

Glimmr analyzes your outfit photos using advanced AI and provides personalized recommendations for:
- 💍 **Jewelry** - Necklaces, earrings, bracelets, rings
- 💄 **Makeup** - Foundation, eyes, lips, blush
- 💇 **Hair** - Styles and accessories  
- 💅 **Nails** - Colors and custom AI-generated designs
- 🎨 **Henna** - Traditional and modern patterns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB & Redis
- OpenAI API key
- Anthropic Claude API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/glimmr.git
cd glimmr

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Set up environment variables
cd backend
cp .env.example .env
# Add your API keys to .env file

cd ../frontend  
cp .env.local.example .env.local
# Configure frontend environment

# 4. Start with Docker (recommended)
cd ..
docker-compose up --build

# OR start manually
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

### First Use
1. Visit `http://localhost:3000`
2. Create an account
3. Upload an outfit photo
4. Get AI-powered style recommendations!

## 🏗️ Tech Stack

**Frontend:**
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- React Query

**Backend:**
- Node.js + Express
- MongoDB + Redis
- OpenAI GPT-4 Vision
- Anthropic Claude

**AI Features:**
- Computer vision analysis
- Style recommendations
- Custom image generation
- Product matching

## 📱 Features

### Free Tier
- ✅ 10 style analyses per month
- ✅ Basic jewelry & makeup recommendations
- ✅ Product shopping links
- ✅ Style history

### Premium ($9.99/month)
- ✅ 100 analyses per month
- ✅ AI-generated nail art designs
- ✅ Custom henna patterns
- ✅ Priority support

### Professional ($29.99/month)  
- ✅ Unlimited analyses
- ✅ Moodboard generation
- ✅ API access
- ✅ White-label options

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](.github/CONTRIBUTING.md).

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://glimmr.app)
- [Documentation](docs/)
- [API Reference](docs/api.md)
- [Support](mailto:support@glimmr.app)

---

**Built with ❤️ for beauty enthusiasts everywhere**
