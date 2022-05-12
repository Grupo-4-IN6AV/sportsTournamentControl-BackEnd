'use strict'

const { validateData } = require('../utils/validate');
const Tournament = require('../models/tournament.model');
const User = require('../models/user.model');
const Team = require('../models/team.model');
const Journey = require('../models/journey.model');

exports.tournamentTest = (req, res) => {
    return res.send({ message: 'Team test is running.' });
}

exports.createTournament = async (req, res) => {
    try {
        const params = req.body;
        const userId = req.user.sub;
        const data =
        {
            name: params.name,
            description: params.description,
            user: userId,
        };
        const msg = validateData(data);
        if (msg) return res.status(400).send(msg);

        const tournamentExist = await Tournament.findOne(
            {
                $and:
                    [
                        { user: userId },
                        { name: data.name }
                    ]
            });

        if (tournamentExist)
            return res.status(400).send({ message: 'This tournament already created.' });

        const tournament = new Tournament(data);
        await tournament.save();
        return res.send({ message: 'Tournament created successfully', tournament });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ err, message: 'Error creating Tournament' });
    }
}

exports.getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find({ user: req.user.sub }).lean();
        if (tournaments.length == 0)
            return res.status(400).send({ message: 'Tournaments not found' });

        return res.send({ tournaments });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ err, message: 'Error getting Tournaments' });
    }
}

exports.getTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findOne(
            {
                $and:
                    [
                        { _id: tournamentId },
                        { user: req.user.sub }
                    ]
            }).lean();
        if (!tournament) return res.status(400).send({ message: 'Tournament Not Found' });

        const teamsExist = await tournament.teams;
        if (teamsExist.length == 0)
            return res.status(400).send({ message: 'This tournament not contains Teams.', tournament });

        return res.send({ tournament });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Tournament', err });
    }
}

exports.updateTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const params = req.body;
        const userId = req.user.sub;

        const data =
        {
            name: params.name,
            description: params.description
        };

        const msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        const tournamentExist = await Tournament.findOne({
            $and:
                [
                    { user: userId },
                    { _id: tournamentId }
                ]
        });

        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament not found' });

        const alreadyTournament = await Tournament.findOne({
            $and:
                [
                    { user: userId },
                    { name: params.name }
                ]
        });

        if (alreadyTournament && alreadyTournament.name != tournamentExist.name)
            return res.status(400).send({ message: 'Tournament already taken' });
        const updateTournament = await Tournament.findOneAndUpdate(
            {
                $and:
                    [
                        { _id: tournamentId },
                        { user: userId }
                    ]
            },
            params,
            { new: true });

        if (!updateTournament)
            return res.status(401).send({ message: 'Tournament not Updated' });

        return res.send({ message: 'Tournament updated successfully', updateTournament });

    } catch (err) {
        console.log(err);
        return res.status(500).send({ err, message: 'Error updating Tournament' });
    }
}


exports.deleteTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.sub;
        const tournamentExist = await Tournament.findOne({
            $and:
                [
                    { user: userId },
                    { _id: tournamentId }
                ]
        });
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament not found' });
        const deleteTournament = await Tournament.findOneAndDelete({
            $and:
                [
                    { user: userId },
                    { _id: tournamentId }
                ]
        });

        if (!deleteTournament)
            return res.status(401).send({ message: 'Tournament not found or already delete.' });
        return res.send({ message: 'Tournament deleted successfully', deleteTournament });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ err, message: 'Error deleting Tournament' });
    }
}



exports.updateTournamentByAdmin = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const params = req.body;
        const userId = req.user.sub;
        if (Object.entries(params).length === 0) return res.status(400).send({ message: 'Empty parameters' });
        const userExist = await User.findOne({ _id: userId });
        if (userExist.role != 'ADMIN') return res.status(400).send({ message: 'Unauthorized to this function' });
        const tournamentExist = await Tournament.findOne({ _id: tournamentId });
        if (!tournamentExist) return res.status(400).send({ message: 'Tournament not found' });
        const alreadyTournament = await Tournament.findOne({ name: params.name });
        if (alreadyTournament && tournamentExist.name != params.name) return res.status(400).send({ message: 'Tournament already taken' });
        const updateTournament = await Tournament.findOneAndUpdate({ _id: tournamentId }, params, { new: true });
        if (!updateTournament) return res.status(401).send({ message: 'Tournament not found' });
        return res.send({ message: 'Tournament updated successfully', updateTournament });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ err, message: 'Error updating Tournament' });
    }
}


exports.deleteTournamentByAdmin = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.sub;
        const userExist = await User.findOne({ _id: userId });
        if (userExist.role != 'ADMIN') return res.status(400).send({ message: 'Unauthorized to this function' });
        const tournamentExist = await Tournament.findOne({ _id: tournamentId });
        if (!tournamentExist) return res.status(400).send({ message: 'Tournament not found' });
        const deleteTournament = await Tournament.findOneAndDelete({ _id: tournamentId });
        if (!deleteTournament) return res.status(401).send({ message: 'Tournament not found' });
        return res.send({ message: 'Tournament deleted successfully', deleteTournament });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ err, message: 'Error deleting Tournament' });
    }
}

exports.getTournamentsByAdmin = async (req, res) => {
    try {
        const tournaments = await Tournament.find().lean();
        if (tournaments.length == 0)
            return res.status(400).send({ message: 'Tournaments not found' });

        return res.send({ tournaments });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ err, message: 'Error getting Tournaments' });
    }
}


exports.getTournamentByAdmin = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findOne(
            { _id: tournamentId }).lean();
        if (!tournament)
            return res.status(400).send({ message: 'Tournament Not Found' });

        return res.send({ message: 'Tournament Found:', tournament });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Tournament', err });
    }
}



//
//Registrar || Agregar Equipos//
exports.addTeam = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const params = req.body;
        const user = req.user.sub;
        const data =
        {
            team: params.teamId,
            proGoals: 0,
            againGoals: 0,
            differenceGoals: 0,
            teamPoints: 0,
            wonMatches: 0,
            tiedMatches: 0,
            lostMatches: 0,
            playedMatchs: 0
        };
        let msg = validateData(data);

        if (msg) return res.status(400).send(msg);
        
        const teamExist = await Team.findOne({ $and: [{ _id: params.teamId }, {user: user}]});
        if (!teamExist) return res.status(400).send({ message: 'Team not found' })
        const teamExistTournament = await Tournament.findOne({ $and: [{ _id: tournamentId }, { 'teams.team': params.teamId }] });
        if (teamExistTournament) return res.status(400).send({ message: 'Team is already in this tournament'})
        const tournamentExist = await Tournament.findOne({ $and: [{ _id: tournamentId }, { user: user }] });
        //Verificar que Exista el Torneo//
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament not found' });

        if (tournamentExist.teams.length > 9)
            return res.status(400).send({ message: 'Cannot add to team because maximum number of added teams reached' });

        //Pushear el Equipo al Torneo//
        await Tournament.findOneAndUpdate(
            { _id: tournamentId },
            { $push: { teams: data } },
            { new: true });

        //Automatizando las Jornadas//
        if (tournamentExist.teams.length > 0) {
            const newJourney = new Journey({ name: `Journey ${tournamentExist.teams.length}` })
            await newJourney.save();

            const pushJourneyTournament = await Tournament.findOneAndUpdate({ _id: tournamentId },
                { $push: { journeys: newJourney._id } }, { new: true });
        }

        const updateTournament = await Tournament.findOne({ _id: tournamentId }).populate('teams');
        if (updateTournament) return res.send({ message: 'Team create successfully in this tournament', updateTournament });
        return res.status(400).send({message: 'Error saving the team in this tournament'});
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error saving this Team.', err });
    }
}

exports.deleteTeam = async(req, res)=>{
    try
    {
        const tournamentId = req.params.id;
        const userId = req.user.sub;
        const params = req.body;
        const data = {
            team: params.teamId
        };
        let msg = validateData(data);
        if (msg) return res.status(400).send(msg);
        const tournamentExist = await Tournament.findOne({ $and: [{ _id: tournamentId }, { user: userId }] });
        //Verificar que Exista el Torneo//
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament not found' });
        const teamExist = await Team.findOne({ $and: [{ _id: params.teamId }, {user: userId}]});
        if (!teamExist) return res.status(400).send({ message: 'Team not found' });
        const teamExistTournament = await Tournament.findOne({ $and: [{ _id: tournamentId }, { 'teams.team': params.teamId }] });
        if (!teamExistTournament) return res.status(400).send({ message: 'Team does not exist in this tournament'});
        const deleteTeam = await Tournament.findOneAndUpdate({
            $and:[{ _id: tournamentId },{"teams.team": params.teamId }]},
            {$pull: {'teams': {'team': params.teamId}}}, {new: true}
        );
        if (!deleteTeam)
            return res.status(401).send({ message: 'Team not found or already deleted in this tournament.' });
        return res.send({ message: 'Team deleted successfully of this Tournament', deleteTeam });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting this Team.', err });
    }
}