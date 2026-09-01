import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL = "http://172.20.10.7:3000";

type Person = {
  id: number;
  name: string;
};

type Relationship = {
  id: number;
  personId: number;
  relatedPersonId: number;
  relationshipType: "parent" | "sibling" | "spouse";
};

const relationshipTypes = ["parent", "sibling", "spouse"] as const;

export default function HomeScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [newPersonName, setNewPersonName] = useState("");

  const [relationshipPersonId, setRelationshipPersonId] =
    useState<number | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<Relationship["relationshipType"]>("parent");
  const [relatedPersonId, setRelatedPersonId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [peopleResponse, relationshipsResponse] = await Promise.all([
        fetch(`${API_URL}/people`),
        fetch(`${API_URL}/relationships`),
      ]);

      const peopleData = await peopleResponse.json();
      const relationshipsData = await relationshipsResponse.json();

      setPeople(peopleData);
      setRelationships(relationshipsData);
    } catch (error) {
      console.log("Could not connect to the server:", error);
    }
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/people`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPersonName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add person");
      }

      const newPerson = await response.json();

      setPeople((currentPeople) => [...currentPeople, newPerson]);
      setNewPersonName("");
    } catch (error) {
      console.log("Could not add person:", error);
    }
  };

  const addRelationship = async () => {
    if (!relationshipPersonId || !relatedPersonId) {
      return;
    }

    if (relationshipPersonId === relatedPersonId) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/relationships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: relationshipPersonId,
          relatedPersonId,
          relationshipType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add relationship");
      }

      const newRelationship = await response.json();

      setRelationships((currentRelationships) => [
        ...currentRelationships,
        newRelationship,
      ]);

      setRelationshipPersonId(null);
      setRelatedPersonId(null);
      setRelationshipType("parent");
    } catch (error) {
      console.log("Could not add relationship:", error);
    }
  };

  const selectedRelationships = selectedPerson
    ? relationships.filter(
        (relationship) =>
          relationship.personId === selectedPerson.id ||
          relationship.relatedPersonId === selectedPerson.id
      )
    : [];

  const getRelationshipType = (relationship: Relationship) => {
    if (relationship.personId === selectedPerson?.id) {
      return relationship.relationshipType;
    }

    if (relationship.relationshipType === "parent") {
      return "child";
    }

    return relationship.relationshipType;
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Family Lineage</Text>

      {!selectedPerson ? (
        <>
          <Text style={styles.subtitle}>People</Text>

          {people.map((person) => (
            <Pressable
              key={person.id}
              style={styles.personButton}
              onPress={() => setSelectedPerson(person)}
            >
              <Text style={styles.personName}>{person.name}</Text>
            </Pressable>
          ))}

          <TextInput
            style={styles.input}
            placeholder="Person's name"
            value={newPersonName}
            onChangeText={setNewPersonName}
          />

          <Pressable style={styles.addButton} onPress={addPerson}>
            <Text style={styles.addButtonText}>+ Add Person</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Add Relationship</Text>

          <Text style={styles.label}>Person</Text>

          {people.map((person) => (
            <Pressable
              key={`relationship-person-${person.id}`}
              style={[
                styles.optionButton,
                relationshipPersonId === person.id &&
                  styles.selectedOption,
              ]}
              onPress={() => setRelationshipPersonId(person.id)}
            >
              <Text style={styles.optionText}>{person.name}</Text>
            </Pressable>
          ))}

          <Text style={styles.label}>Relationship type</Text>

          <View style={styles.typeRow}>
            {relationshipTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  relationshipType === type && styles.selectedOption,
                ]}
                onPress={() => setRelationshipType(type)}
              >
                <Text style={styles.typeText}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Related person</Text>

          {people.map((person) => (
            <Pressable
              key={`related-person-${person.id}`}
              style={[
                styles.optionButton,
                relatedPersonId === person.id && styles.selectedOption,
              ]}
              onPress={() => setRelatedPersonId(person.id)}
            >
              <Text style={styles.optionText}>{person.name}</Text>
            </Pressable>
          ))}

          <Pressable style={styles.addButton} onPress={addRelationship}>
            <Text style={styles.addButtonText}>
              + Add Relationship
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable onPress={() => setSelectedPerson(null)}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <Text style={styles.selectedName}>{selectedPerson.name}</Text>

          <Text style={styles.subtitle}>Relationships</Text>

          {selectedRelationships.map((relationship) => {
            const otherPersonId =
              relationship.personId === selectedPerson.id
                ? relationship.relatedPersonId
                : relationship.personId;

            const otherPerson = people.find(
              (person) => person.id === otherPersonId
            );

            if (!otherPerson) {
              return null;
            }

            const type = getRelationshipType(relationship);

            return (
              <Pressable
                key={relationship.id}
                style={styles.relationship}
                onPress={() => setSelectedPerson(otherPerson)}
              >
                <Text style={styles.relationshipType}>{type}</Text>
                <Text style={styles.otherPerson}>
                  {otherPerson.name}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 32,
    marginBottom: 16,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  personButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  personName: {
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 6,
  },
  selectedOption: {
    borderColor: "#007AFF",
    backgroundColor: "#EAF3FF",
  },
  optionText: {
    fontSize: 17,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  typeText: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  back: {
    fontSize: 18,
    marginBottom: 24,
  },
  selectedName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
  },
  relationship: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  relationshipType: {
    fontSize: 16,
    color: "#666",
    textTransform: "capitalize",
  },
  otherPerson: {
    fontSize: 21,
    marginTop: 4,
  },
});