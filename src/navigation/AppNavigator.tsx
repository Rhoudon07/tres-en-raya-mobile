import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';

import { HomeScreen } from '../screens/HomeScreen';
import { BoardSelectScreen } from '../screens/BoardSelectScreen';
import { GameModeScreen } from '../screens/GameModeScreen';
import { GameScreen } from '../screens/GameScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { PuzzleScreen } from '../screens/PuzzleScreen';
import { LabScreen } from '../screens/LabScreen';
import { CampaignMapScreen } from '../screens/CampaignMapScreen';

export type RootStackParamList = {
  Home: undefined;
  BoardSelect: undefined;
  GameMode: undefined;
  Game: undefined;
  Review: undefined;
  Statistics: undefined;
  Settings: undefined;
  About: undefined;
  Puzzle: undefined;
  Lab: undefined;
  Campaign: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false,
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="BoardSelect" component={BoardSelectScreen} />
      <Stack.Screen name="GameMode" component={GameModeScreen} />
      <Stack.Screen name="Game" component={GameScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Puzzle" component={PuzzleScreen} />
      <Stack.Screen name="Lab" component={LabScreen} />
      <Stack.Screen name="Campaign" component={CampaignMapScreen} />
    </Stack.Navigator>
  );
};
