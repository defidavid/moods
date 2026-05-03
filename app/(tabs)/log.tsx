import { View, Text } from "react-native";
import { colors } from "../../lib/colors";
import { typography } from "../../lib/typography";

export default function Screen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={typography.title}>Log</Text>
    </View>
  );
}
