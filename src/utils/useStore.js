import {uid} from "uid";
import {create} from "zustand";
import {persist} from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import unixDate from "./unixDate";

import {FIRESTORE_DB} from "../../firebaseConfig.js";
import {doc, addDoc, setDoc, collection, deleteDoc} from "firebase/firestore";

const useStore = create(
    persist(
        (set, get) => {
            const hour = new Date().getHours();
            const minute = new Date().getMinutes();

            return {
                history: [],
                calorieGoals: [{date: unixDate(), goal: 1600}],
                dishes: [],
                exercises: [],
                routine: [],
                routineDisplay: [],
                completedWorkouts: [],

                setCalorieGoal: (userInput) => {
                    const newGoal =
                        userInput !== undefined
                            ? userInput
                            : get().calorieGoals.at(-1).goal;

                    set((state) => ({
                        calorieGoals: [
                            ...state.calorieGoals
                                .filter((goalEntry) => goalEntry.date !== unixDate()),
                            { date: unixDate(), goal: newGoal },
                        ],
                    }));
                },


                addHistoryEntry: async (caloriesInput, mealInput = "⚡️ ---") => {
                    const entry = {
                        id: uid(),
                        date: unixDate(),
                        meal: `${mealInput}`,
                        calories: `${caloriesInput}`,
                        time_stamp: `${hour < 10 ? "0" + hour : hour}:${
                            minute < 10 ? "0" + minute : minute
                        }`,
                    };
                    const previousHistory = await get().history;
                    set((state) => ({
                        history: [...previousHistory, entry]
                    }));

                    const docRef = doc(FIRESTORE_DB, `history/${entry.id}`);
                    await setDoc(docRef, {
                        entry
                    });
                },

                resetStore: () =>
                    set(() => ({
                        history: [],
                        calorieGoals: [{date: unixDate(), goal: 1600}],
                        dishes: [],
                        exercises: [],
                        routine: [],
                        routineDisplay: [],
                        completedWorkouts: [],
                    })),


                deleteHistoryEntry: (entryToDelete) => {
                    const ref = doc(FIRESTORE_DB, `history/${entryToDelete.id}`);
                    deleteDoc(ref).then(() => {
                        console.log("Document successfully deleted!");
                    }).catch((error) => {
                        console.error("Error removing document: ", error);
                    });
                    set((state) => ({
                        history: state.history.filter(
                            (entry) => entry.id !== entryToDelete.id
                        ),
                    }));
                },

                addDish: (
                    mealInput,
                    caloriesInput,
                    massInput = 0,
                    proteinsInput = 0,
                    carbsInput = 0,
                    notesInput = ""
                ) =>
                    set((state) => ({
                        dishes: [
                            {
                                meal: `${mealInput}`,
                                calories: `${caloriesInput}`,
                                mass: `${massInput}`,
                                proteins: `${proteinsInput}`,
                                carbs: `${carbsInput}`,
                                notes: `${notesInput}`,
                            },
                            ...state.dishes,
                        ],
                    })),

                deleteDish: (dishToDelete) =>
                    set((state) => ({
                        dishes: state.dishes
                            .slice()
                            .filter((dish) => dish !== dishToDelete),
                    })),

                addWorkout: (workoutTitle) =>
                    set((state) => ({
                        exercises: [
                            {
                                id: uid(),
                                workout: workoutTitle,
                                title: " NEW ",
                                sets: 0,
                                reps: 0,
                                weight: 0,
                                time: "00:00",
                                notes: "",
                            },
                            ...state.exercises,
                        ],
                    })),

                addExercise: (workoutTitle) => {
                    const id = uid();
                    set((state) => ({
                        exercises: [
                            ...state.exercises,
                            {
                                id:
                                    id === state.exercises.some((exercise) => exercise.id === id)
                                        ? `${id}abc`
                                        : id,
                                workout: workoutTitle,
                                title: " NEW ",
                                sets: 0,
                                reps: 0,
                                weight: 0,
                                time: "00:00",
                                notes: "",
                            },
                        ],
                    }));
                },

                setExercise: (index, formData) => {
                    const exercises = useStore.getState().exercises;
                    exercises.splice(index, 1, formData);
                    set(() => ({
                        exercises: exercises,
                    }));
                },

                deleteWorkout: (workoutTitle) => {
                    const exercises = useStore
                        .getState()
                        .exercises.filter((exercise) => exercise.workout !== workoutTitle);
                    set(() => ({
                        exercises: exercises,
                    }));
                },

                deleteExercise: (id) =>
                    set((state) => ({
                        exercises: state.exercises.filter((exercise) => exercise.id !== id),
                    })),

                setRoutine: (routineArr) => {
                    const calendarRoutine = [];

                    const datedWorkouts = routineArr.map((workout, index) => ({
                        id: workout.id,
                        workout: workout.workout,
                        date: unixDate + index * 86400000,
                    }));

                    for (let i = 0; i < 100; i++) {
                        datedWorkouts.forEach((workout) => {
                            if (calendarRoutine.length < 1000) {
                                if (true) {
                                    calendarRoutine.push({
                                        id: workout.id,
                                        workout: workout.workout,
                                        date: workout.date + i * (datedWorkouts.length * 86400000),
                                    });
                                }
                            }
                        });
                    }
                    set(() => ({
                        routine: calendarRoutine,
                    }));
                },

                setRoutineDisplay: (routineArr) => {
                    set(() => ({
                        routineDisplay: routineArr,
                    }));
                },
                setCompletedWorkouts: (date) => {
                    set((state) => ({
                        completedWorkouts: [...state.completedWorkouts, {date: date}],
                        routine: state.routine.filter((workout) => workout.date !== date),
                    }));
                },
            };
        },
        {
            name: "trackedDataStorage",
            storage: {
                getItem: async (key) => {
                    const value = await SecureStore.getItemAsync(key);
                    return value ? JSON.parse(value) : undefined;
                },
                setItem: async (key, value) => {
                    await SecureStore.setItemAsync(key, JSON.stringify(value));
                },
                removeItem: async (key) => {
                    await SecureStore.deleteItemAsync(key);
                },

            },

        }
    )
);

export default useStore;
