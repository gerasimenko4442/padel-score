import { useState } from 'react';
import type { AppScreen } from './types';
import { useGameState } from './hooks/useGameState';
import { SplashPage } from './pages/SplashPage';
import { NewGamePage } from './pages/NewGamePage';
import { AddPlayersPage } from './pages/AddPlayersPage';
import { GameModePage } from './pages/GameModePage';
import { SetupCourtsPage } from './pages/SetupCourtsPage';
import { RoundPage } from './pages/RoundPage';
import { FinalResultsPage } from './pages/FinalResultsPage';

export default function App() {
  const game = useGameState();
  const [screen, setScreen] = useState<AppScreen>('splash');

  const handleResume = () => {
    const loaded = game.resumeGame();
    if (!loaded) return;
    if (loaded.status === 'in_progress') setScreen('round');
    else if (loaded.status === 'finished') setScreen('finalResults');
    else setScreen('addPlayers');
  };

  const handleStartGame = () => {
    if (game.startGame()) setScreen('round');
  };

  const handleAdvance = (finish: boolean) => {
    const ok = game.advanceRound(finish);
    if (ok && finish) setScreen('finalResults');
  };

  const handleNewGameFromResults = () => {
    game.resetGame();
    setScreen('splash');
  };

  switch (screen) {
    case 'splash':
      return (
        <SplashPage
          resumeAvailable={game.resumeAvailable}
          onResume={handleResume}
          onDiscardResume={game.discardSavedGame}
          onStartNew={() => setScreen('newGame')}
        />
      );

    case 'newGame':
      return (
        <NewGamePage
          onBack={() => setScreen('splash')}
          onCreate={(name) => {
            game.createGame(name);
            setScreen('addPlayers');
          }}
        />
      );

    case 'addPlayers':
      return (
        <AddPlayersPage
          players={game.state.players}
          error={game.error}
          onClearError={game.clearError}
          onAdd={game.addPlayer}
          onRemove={game.removePlayer}
          onBack={() => setScreen('newGame')}
          onNext={() => setScreen('gameMode')}
        />
      );

    case 'gameMode':
      return (
        <GameModePage
          gameMode={game.state.settings.gameMode}
          fixedTeams={game.state.fixedTeams}
          players={game.state.players}
          error={game.error}
          onClearError={game.clearError}
          onSetMode={game.setGameMode}
          onSwapFixedPlayers={game.swapFixedTeamPlayers}
          onShuffleFixedTeams={game.shuffleFixedTeams}
          onBack={() => setScreen('addPlayers')}
          onNext={() => setScreen('setupCourts')}
        />
      );

    case 'setupCourts':
      return (
        <SetupCourtsPage
          playerCount={game.state.players.length}
          courtsCount={game.state.settings.courtsCount}
          gameMode={game.state.settings.gameMode}
          genderRulesEnabled={game.state.settings.genderRulesEnabled}
          error={game.error}
          onClearError={game.clearError}
          onSetCourtsCount={game.setCourtsCount}
          onSetGenderRules={game.setGenderRules}
          onBack={() => setScreen('gameMode')}
          onStart={handleStartGame}
        />
      );

    case 'round':
      if (!game.currentRound) {
        // Defensive fallback: shouldn't happen since 'round' is only reached
        // once a round has been generated, but avoids a hard crash if it does.
        setScreen('setupCourts');
        return null;
      }
      return (
        <RoundPage
          state={game.state}
          currentRound={game.currentRound}
          isCurrentRoundFullyScored={game.isCurrentRoundFullyScored}
          error={game.error}
          onClearError={game.clearError}
          genderWarning={game.genderWarning}
          onClearGenderWarning={game.clearGenderWarning}
          onSubmitScore={game.submitMatchScore}
          onReroll={game.rerollPairing}
          onSwapInRound={game.swapInRound}
          onToggleVoluntaryRest={game.toggleVoluntaryRest}
          onAdvance={handleAdvance}
          onResetGame={() => {
            game.resetGame();
            setScreen('splash');
          }}
        />
      );

    case 'finalResults':
      return <FinalResultsPage state={game.state} onNewGame={handleNewGameFromResults} />;

    default:
      return null;
  }
}
