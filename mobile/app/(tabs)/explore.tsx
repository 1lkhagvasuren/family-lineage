import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Platform } from "react-native";

const API_URL = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export default function ExploreScreen() {
  const [relationships, setRelationships] = useState([]);

  useEffect(() => {
    fetch(API_URL + "/relationships")
      .then((res) => res.json())
      .then((data) => setRelationships(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Relationships Overview</Text>
      {relationships.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.item}>Person {r.personId} is {r.relationshipType} of Person {r.relatedPersonId}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 10 },
  item: { fontSize: 16 },
});
