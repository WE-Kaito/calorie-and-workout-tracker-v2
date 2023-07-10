import { uid } from "uid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import unixDate from "./unixDate";
import firebase from "../../firebaseConfig";

const useStore = create(
  persist(
    (set, get) => {
      const hour = new Date().getHours();
      const minute = new Date().getMinutes();

      return {
        history: [],
        calorieGoals: [{ date: unixDate(), goal: 1600 }],
        dishes: [],
        exercises: [],
        routine: [],
        routineDisplay: [],
        completedWorkouts: [],

        setCalorieGoal: (userInput ) =>
          set((state) => {
            const newGoal =
              userInput !== undefined
                ? userInput
                : state.calorieGoals.at(-1).goal;

            return {
              calorieGoals: [
                ...state.calorieGoals
                  .slice()
                  .filter((goalEntry) => goalEntry.date !== unixDate()),
                { date: unixDate(), goal: newGoal },
              ],
            };
          }),

        addHistoryEntry: (caloriesInput, mealInput = "⚡️ ---") =>
            set((state) => {
              const entry = {
                id: uid(),
                date: unixDate(),
                meal: `${mealInput}`,
                calories: `${caloriesInput}`,
                time_stamp: `${hour < 10 ? "0" + hour : hour}:${
                    minute < 10 ? "0" + minute : minute
                }`,
              };
              const updatedHistory = [...state.history, entry];
              set({ history: updatedHistory });
              firebase.firestore().collection("history").add(entry); // Save to Firestore
            }),

        resetStore: () =>
            set(() => ({
                history: [],
                calorieGoals: [{ date: unixDate(), goal: 1600 }],
                dishes: [],
                exercises: [],
                routine: [],
                routineDisplay: [],
                completedWorkouts: [],
            })),


        deleteHistoryEntry: (entryToDelete) =>
            set((state) => ({
              history: state.history.filter(
                  (entry) => entry.id !== entryToDelete.id
              ),
            })),

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
            completedWorkouts: [...state.completedWorkouts, { date: date }],
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
        getStorage: () => firebase.firestore(),
      },

    }
  )
);

export default useStore;
