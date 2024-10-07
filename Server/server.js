const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

mongoose
    .connect(MONGO_URI,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
    .then(() => console.log('Connected successfully to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));
        

const healthDataSchema = new mongoose.Schema({
        date: {type: Date, default: Date.now},
        steps: Number,
        caloriesBurned: Number,
        distanceCovered: Number,
        weight: Number,
    });

const healthData = mongoose.model('healthData', healthDataSchema);

const seedData = async () => {
    try {
        const existingData = await healthData.find();
        if (existingData.length === 0) {
            const initialData = [
                {
                    date: new Date('2021-01-01'),
                    steps: 5000,
                    caloriesBurned: 5000,
                    distanceCovered: 5000,
                    weight: 80,
                },
                {
                    date: new Date('2021-01-02'),
                    steps: 10000,
                    caloriesBurned: 10000,
                    distanceCovered: 10000,
                    weight: 100,
                }
            ]
            ;
                await healthData.insertMany(initialData);
                console.log('Seed data inserted successfully');
            } else {
                console.log('Data already exists');
            }
    } catch (error) {
            console.error('Error seeding data: ', error);
    }
};

seedData(); 

app.get('/tracks',
    async (req, res) => {
        try {
            const allTracks = await healthData.find();
            res.json(allTracks);
        } catch (error) {
            console.error('Error fetching data: ', error);
            res.status(500).json({ error: 'Error fetching data' });
        }
    }
)

app.get('/tracks/:date', async (req, res) => {
    const requestedDate = new Date(req.params.date);
    try{
        const tracksForDay = 
        await healthData.find(
            {
                date: {
                    $gte: requestedDate,
                    $: new Date(
                        requestedDate.getTime()
                        + 24 * 60 * 60 * 1000
                    )
                }
            });
        res.json(tracksForDay)
    } catch (error) {
        res.status(500)
        .json({ error: 'Internal Server Error' });
    }
});

app.put('/tracks/:date', 
    async (req, res) => {
        const requestedDate = new Date(req.params.date);
        try {
            const existingTrack = await healthData.findOne(
                {
                    date:
                    {
                        $gte: requestedDate,
                        $lt: new Date(
                            requestedDate.getTime()
                            + 24 * 60 * 60 * 1000
                        )
                    }
                });
            console.log('existing track', existingTrack);
            if (existingTrack) {
                Object.assign(existingTrack, req.body);
                await existingTrack.save();
                res.json(existingTrack);
            } else {
                const newTrack = new healthData({
                    daty: requestedDate,
                    ...req.body
                });
                await newTrack.save();
                console.log(newTrack)
                res.status(200).json(newTrack);
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});