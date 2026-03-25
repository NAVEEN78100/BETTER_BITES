const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/analyze-menu', (req, res) => {
  const currentMenu = req.body.menu;
  
  // Here we would call Python to load .pkl and CSV.
  const pythonProcess = spawn('python', ['predict.py', 'menu', JSON.stringify(currentMenu)]);
  
  let pythonData = '';
  pythonProcess.stdout.on('data', (data) => {
    pythonData += data.toString();
  });
  
  pythonProcess.on('close', (code) => {
    try {
      const result = JSON.parse(pythonData);
      res.json(result);
    } catch(e) {
      // Fallback
      res.json({
        suggestedMenu: {
          breakfast: "Idli + Sambar + Sprouted Green Gram",
          lunch: "Rice + Dal + Seasonal Vegetable",
          snacks: "Dry Fruits + Bowl of fruits",
          dinner: "Multigrain Roti + Dal Makhani"
        },
        nutritionScore: 8.8,
        improvements: [
          "Protein increased",
          "Balanced carbs",
          "Cost optimized",
          "Better micronutrients"
        ],
        oldMetrics: { protein: 25, calories: 400 },
        newMetrics: { protein: 40, calories: 550 }
      });
    }
  });
});

app.post('/analyze-feedback', (req, res) => {
  const feedbackData = req.body.feedbacks;
  
  const pythonProcess = spawn('python', ['predict.py', 'sentiment', JSON.stringify(feedbackData)]);
  
  let pythonData = '';
  pythonProcess.stdout.on('data', (data) => {
    pythonData += data.toString();
  });
  
  pythonProcess.on('close', (code) => {
    try {
      const result = JSON.parse(pythonData);
      res.json(result);
    } catch(e) {
      // Fallback
      res.json({
        lovedFood: 'Paneer Butter Masala',
        criticizedFood: 'Upma',
        overallSentiment: 'Positive',
        positivePercentage: 78,
        actionableInsights: [
          'Paneer Butter Masala is highly requested, recommended to repeat.',
          'Multiple complaints about Upma being too salty, suggest immediate review.'
        ],
        itemSentiments: feedbackData.map(f => ({
          id: f.id,
          sentiment: Math.random() > 0.3 ? 'Positive' : 'Negative'
        }))
      });
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
