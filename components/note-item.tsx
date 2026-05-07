import { colors } from "@/constants/theme";
import { Nota } from "@/types/nota";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
  item: Nota
  onPress: () => void
}

export default function NoteItem({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
    >
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardContent} numberOfLines={2}>
        {item.contenido}
      </Text>
      <Text style={styles.cardDate}>
        {new Date(item.creadaEn).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 },
  cardContent: { fontSize: 14, color: colors.muted, marginBottom: 8 },
  cardDate: { fontSize: 12, color: colors.muted }
})