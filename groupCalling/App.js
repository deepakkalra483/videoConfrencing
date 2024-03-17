
import React, { useEffect } from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Home from './src/screen/Home';
import Meeting from './src/screen/meeting';


const App = () => {
  const Stack = createStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}>
        <Stack.Screen
          name='Home'
          component={Home}
          options={{ headerShown: false }} />

        <Stack.Screen
          name='Meeting'
          component={Meeting}
          options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
  // useEffect(() => {
  //   const socket = io('http://192.168.1.110:3000');

  //   socket.on('connect', () => {
  //     console.log('Connected to server');
  //   });

  //   socket.on('disconnect', () => {
  //     console.log('Disconnected from server');
  //   });

  //   // Add more event listeners as needed

  //   return () => {
  //     socket.disconnect(); // Clean up on unmount
  //   };
  // }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>


    </View>
  )
}

export default App;
