import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, Button, ScrollView, Platform } from "react-native";

const API_URL = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export default function HomeScreen() {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState("");
  const [personId, setPersonId] = useState("");
  const [relatedPersonId, setRelatedPersonId] = useState("");
  const [relationshipType, setRelationshipType] = useState("parent");

  const fetchData = async () => {
    try {
      const [peopleRes, relRes] = await Promise.all([
        fetch(API_URL + "/people"),
        fetch(API_URL + "/relationships"),
      ]);
      const peopleData = await peopleRes.json();
      setPeople(peopleData);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPerson = async () => {
    if (!name) return;
    try {
      await fetch(API_URL + "/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      fetchData();
    } catch (err) {
      console.error("Add person error:", err);
    }
  };

  const handleAddRelationship = async () => {
    if (!personId || !relatedPersonId) return;
    try {
      await fetch(API_URL + "/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: parseInt(personId),
          relatedPersonId: parseInt(relatedPersonId),
          relationshipType,
        }),
      });
      setPersonId("");
      setRelatedPersonId("");
      fetchData();
    } catch (err) {
      console.error("Add relationship error:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Family Lineage</Text>
      
      <View style={styles.card}>
        <Text style={styles.title}>Add Person</Text>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <Button title="Add Person" onPress={handleAddPerson} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Add Relationship</Text>
        <TextInput style={styles.input} placeholder="Person ID" value={personId} onChangeText={setPersonId} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Related Person ID" value={relatedPersonId} onChangeText={setRelatedPersonId} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Type (parent, sibling, spouse)" value={relationshipType} onChangeText={setRelationshipType} />
        <Button title="Add Relationship" onPress={handleAddRelationship} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>People Directory</Text>
        {people.map((p) => (
          <Text key={p.id} style={styles.item}>ID {p.id}: {p.name}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, marginBottom: 10 },
  item: { fontSize: 16, paddingVertical: 4 },
});
