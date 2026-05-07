import { useNavigation } from "expo-router";
import { CommonActions } from "@react-navigation/native";
import { colors } from "@/constants/theme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const navigation = useNavigation();

  const handleLogout = () => {
    navigation.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "index" }] })
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>?</Text>
        </View>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.email}>Usuario Desconocido</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: colors.tint, marginTop: 16 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.muted,
  },
});
