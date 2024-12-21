<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import TheComboBox from "$lib/components/TheComboBox.svelte";
    import singlePoints from "$lib/dartPoints/dartPointsSingles.json";
    import doublePoints from "$lib/dartPoints/dartPointsDoubles.json";
    import triplePoints from "$lib/dartPoints/dartPointsTriples.json";
    import { fade, fly } from "svelte/transition";
    import { Alert, Button } from "stwui";
    import TheButton from "$lib/components/TheButton.svelte";
    import { baseUrl } from "$lib/constants";

    export let data: PageData;

    let showAlert = false;
    let gameFact: string = "Game logged lamo";
    let showError: boolean = false;
    let logError: string = "Error logging game!";

    let selectedPlayers: any[] = [];
    let playersCopy: any[] = [];
    let selectedPlayerId: any;
    let isGameStarted = false;
    let isGameFinished = false;
    let playingPlayers: any[] = [];
    export let currentPlayingPlayer: any = null;
    let shotsTaken: number[] = [];
    let isBust = false;

    let winningPlayers: any[] = [];

    let allPoints = [...singlePoints, ...doublePoints, ...triplePoints];

    onMount(() => {
        playersCopy = data.mappedPlayers;
    });

    $: selectedPlayerId, addSelectedPlayer(selectedPlayerId);

    const addSelectedPlayer = (selectedPlayerId: number) => {
        if (!selectedPlayerId) {
            return;
        }

        if (selectedPlayers.find((player) => player.id === selectedPlayerId)) {
            return;
        }

        const selectedPlayer = data.players.find(
            (player: any) => player.id === selectedPlayerId,
        );

        selectedPlayers.push({
            ...selectedPlayer,
            score: 301,
            currentlyPlaying: false,
        });
        selectedPlayers = selectedPlayers;
        updatePlayerList();
    };

    const toggleError = () => {
        showError = true;

        setTimeout(() => {
            showError = false;
            logError = "";
        }, 3000);
    };

    const updatePlayerList = () => {
        playersCopy = data.mappedPlayers.map((x: any) => {
            return {
                id: x.id,
                label: x.label,
                value: x.value,
                disabled: selectedPlayers.map((x) => x.id).includes(x.id),
                rank: 0,
            };
        });
        playersCopy = playersCopy;
    };

    const startGame = () => {
        if (selectedPlayers.length <= 1) {
            logError = "Need at least two players to play a game!";
            toggleError();
            return;
        }

        isGameStarted = true;

        playingPlayers = selectedPlayers
            .map((x) => {
                return {
                    id: x.id,
                    name: x.name,
                    rating: x.rating,
                    gamesPlayed: x.gamesPlayed,
                    dateCreated: x.dateCreated,
                    score: 301,
                };
            })
            .sort((a, b) => a.rating - b.rating);
        selectedPlayers = selectedPlayers.sort((a, b) => a.rating - b.rating);
        currentPlayingPlayer = playingPlayers[0];
        selectedPlayers[0] = { ...selectedPlayers[0], currentPlaying: true };
    };

    const stopGame = () => {
        isGameStarted = false;
    };

    const addPoint = (point: number) => {
        if (shotsTaken.length === 3) {
            return;
        }

        shotsTaken = [...shotsTaken, point];

        // Checks if player busted or not, if so reset to the original score that he had before round
        if (currentPlayingPlayer.score - point < 0) {
            isBust = true;
            const playerIndex = selectedPlayers.findIndex(
                (x) => x.id === currentPlayingPlayer.id,
            );
            if (playerIndex !== -1) {
                currentPlayingPlayer = selectedPlayers[playerIndex];
            }
        } else {
            currentPlayingPlayer = {
                ...currentPlayingPlayer,
                score: currentPlayingPlayer.score - point,
            };
        }
    };

    const handleWinner = (p: any) => {
        if (winningPlayers.map((x) => x.id).includes(p.id)) {
            return;
        }
        winningPlayers = [...winningPlayers, p];

        if (winningPlayers.length === selectedPlayers.length) {
            isGameFinished = true;
        }
    };

    const nextPlayer = () => {
        isBust = false;
        const playerIndex = selectedPlayers.findIndex(
            (x) => x.id === currentPlayingPlayer.id,
        );

        if (!currentPlayingPlayer) {
            return;
        }

        if (playerIndex !== -1) {
            selectedPlayers[playerIndex] = { ...currentPlayingPlayer };
        }

        if (currentPlayingPlayer.score === 0) {
            handleWinner(currentPlayingPlayer);
        }

        shotsTaken = [];

        const currentPlayerIndex = playingPlayers.findIndex(
            (x) => x.id === currentPlayingPlayer.id,
        );

        if (currentPlayerIndex !== -1) {
            playingPlayers[currentPlayerIndex] = { ...currentPlayingPlayer };
        }

        currentPlayingPlayer =
            playingPlayers[(currentPlayerIndex + 1) % playingPlayers.length];

        if (currentPlayingPlayer.score === 0) {
            nextPlayer();
        }

        selectedPlayers = selectedPlayers;
    };

    const postGame = async () => {
        if (!isGameFinished) {
            return;
        }
        if (winningPlayers.length !== selectedPlayers.length) {
            logError = "Not all players are done playing!";
            toggleError();
        }
        const payload = winningPlayers.map((p) => p.id);

        try {
            const response = await fetch(baseUrl + "/games/multiple", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ playerIds: payload }),
            });

            if (response.ok) {
                gameFact = "Looking good!";
                showAlert = true;
                showError = false;
                // showRevert = true;

                const data = await response.json();
                // playerSnapshots = data.playerSnapshots;
                // gameId = data.id;

                setTimeout(() => {
                    showAlert = false;
                }, 7000);

                setTimeout(() => {
                    //   showRevert = false;
                }, 10000);
            } else {
                console.error("Failed to submit game.");
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    };
</script>

<h1 class="mb-3">Play</h1>

<div class="wrapper">
    <div class="grid-container">
        <div class="combobox-container">
            <TheComboBox
                placeholder="Add players"
                bind:player={selectedPlayerId}
                players={playersCopy || data.players}
            />
        </div>

        <div class="players-grid">
            {#each selectedPlayers as sp}
                <div
                    class={`${sp.currentlyPlaying ? "selected-player" : ""} rounded shadow-md p-2 shadow-lg player-card`}
                >
                    <h2 class="text-lg font-bold">
                        {sp.name || "Player two"}
                    </h2>
                    <p>
                        Elo: {sp.rating || "N/A"}
                    </p>
                    <p>
                        Score: {sp.score === 0 ? "Done" : sp.score || "N/A"}
                    </p>
                    {#if sp.currentlyPlaying}
                        <p>im him</p>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</div>

{#if !isGameStarted}
    <div class="text-center" style="margin-top: 20px">
        <TheButton href="" label="Start" functionToCall={startGame} />
    </div>
{/if}

{#if isGameStarted}
    <div class="playing-wrapper">
        <div class="points-grid">
            {#each allPoints as p}
                <button class="point" on:click={() => addPoint(p.value)}>
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="player-info">
            <!-- player playing -->
            <!-- <h2 class="text-center mt-5">Playing</h2> -->
            <div class="rounded shadow-md p-4 shadow-lg playing-player-card">
                <h2
                    class="mb-3 text-2xl font-bold flex"
                    style="font-family: 'Akira'"
                >
                    {currentPlayingPlayer && currentPlayingPlayer.name}
                </h2>
                <span class="flex items-center flex-col">
                    <h3>Score:</h3>
                    <h5 style="font-size: 70px">
                        {#if isBust}
                            buuuuuuust
                        {:else}
                            {currentPlayingPlayer && currentPlayingPlayer.score}
                        {/if}
                    </h5>
                </span>
                <TheButton href="" label="Next" functionToCall={nextPlayer} />
                <span class="flex">
                    <!-- <h3>Shots taken:</h3> -->
                    {#if shotsTaken.length}
                        {#each shotsTaken as s}
                            <p
                                style="margin-right: 10px; margin-top: 10px; font-size: 40px"
                            >
                                {s}
                            </p>
                        {/each}
                    {/if}
                </span>
            </div>
        </div>

        {#if winningPlayers.length > 0}
            <div class="winning-players-container">
                <h2>Finished players:</h2>
                {#each winningPlayers as p, index}
                    <div class="player-card">
                        <!-- <span class="flex"> -->
                        {p.name}
                        <!-- </span> -->
                    </div>
                {/each}
                {#if isGameFinished}
                    <TheButton href="" label="Post" functionToCall={postGame} />
                {/if}
            </div>
        {/if}
    </div>
{/if}

{#if showAlert}
    <div class="alert" in:fly={{ y: 200, duration: 2000 }} out:fade>
        <Alert type="success">
            <Alert.Title slot="title">Success</Alert.Title>
            <Alert.Description slot="description" class="italic"
                >{gameFact}</Alert.Description
            >
        </Alert>
    </div>
{/if}

{#if showError}
    <div class="alert" in:fly={{ y: 200, duration: 2000 }} out:fade>
        <Alert type="error">
            <Alert.Title slot="title">Error!</Alert.Title>
            <Alert.Description slot="description" class="italic"
                >{logError}</Alert.Description
            >
        </Alert>
    </div>
{/if}

<style lang="scss">
    .winning-players-container {
        display: flex;
        align-items: center;
        flex-direction: column;
    }
    .selected-player {
        background-color: #d4f8d4; /* Light green */
        border-color: #34c759; /* Green border */
    }
    .points-grid {
        display: grid;
        grid-template-rows: repeat(10, 1fr); /* 10 items per column */
        grid-auto-flow: column; /* Fill columns first, then rows */
        gap: 10px;
    }

    .playing-wrapper {
        margin-top: 40px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr; /* Points section on the left, player info centered */
        gap: 5px; /* Space between columns */
        // align-items: center;
    }

    .points {
        display: flex;
        justify-content: center;
    }

    .point-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 2px;
    }

    .player-info {
        display: flex;
        height: 500px;
        // justify-content: center;
        // align-items: center;
    }

    .playing-player-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 10px;
        width: 460px;
        height: auto;
        border: 3px solid black;
        border-radius: 15px;
        overflow: hidden;
        box-shadow:
            14px 14px 0 -4px black,
            14px 14px 0 0 black;

        p {
            font-size: 17px;
            text-align: left;
        }
    }

    .point {
        padding: 5px;
        background-color: #f4f4f4;
        border: 1px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
        text-align: center;
    }

    .point:hover {
        background-color: #e2e2e2;
    }

    .wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        width: 100%;
    }

    .grid-container {
        display: grid;
        grid-template-columns: 1fr 2fr; /* Combobox takes 1/3, players take 2/3 */
        gap: 20px;
        width: 100%;
        align-items: start; /* Align items to the top of their rows */
    }

    .combobox-container {
        width: 100%;
        max-width: 300px;
    }

    .players-grid {
        display: grid;
        grid-template-columns: repeat(
            auto-fill,
            minmax(120px, 1fr)
        ); /* Smaller player cards */
        gap: 10px;
        justify-items: center;
        align-content: start;
    }

    .player-card {
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 8px;
        text-align: center;
        width: 120px; /* Smaller fixed width */
    }

    /* Optional: Make the layout responsive */
    @media (max-width: 768px) {
        .grid-container {
            grid-template-columns: 1fr; /* Stack combobox and players on small screens */
        }

        .combobox-container,
        .players-grid {
            width: 100%;
        }
    }

    .alert {
        position: fixed;
        top: 10%;
        right: 20px;
        z-index: 1000;
        width: 400px;
    }
</style>
