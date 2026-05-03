import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "../../lib/colors";
import { typography } from "../../lib/typography";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        typography.caption,
        {
          color: focused ? colors.text : colors.textMuted,
          fontWeight: focused ? "600" : "400",
        },
      ]}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 56,
        },
        tabBarIcon: () => <View />,
      }}
    >
      <Tabs.Screen
        name="log"
        options={{
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Log" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Today" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Insights" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
