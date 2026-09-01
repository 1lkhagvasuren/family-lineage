import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
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
  relationshipType: string;
};

export default function HomeScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/people`).then((response) => response.json()),
      fetch(`${API_URL}/relationships`).then((response) => response.json()),
    ])
      .then(([peopleData, relationshipsData]) => {
        setPeople(peopleData);
        setRelationships(relationshipsData);
      })
      .catch(() => {
        console.log("Could not connect to the server");
      });
  }, []);

  const selectedRelationships = selectedPerson
    ? relationships.filter(
        (relationship) =>
          relationship.personId === selectedPerson.id ||
          relationship.relatedPersonId === selectedPerson.id
      )
    : [];

  return (
    <View style={styles.container}>
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
        </>
      ) : (
        <>
          <Pressable onPress={() => setSelectedPerson(null)}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <Text style={styles.selectedName}>
            {selectedPerson.name}
          </Text>

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

            let type = relationship.relationshipType;

            if (relationship.personId !== selectedPerson.id) {
              if (type === "parent") {
                type = "child";
              }
            }

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#fff",
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