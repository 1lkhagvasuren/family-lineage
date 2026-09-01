import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
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
  relationshipType: "parent" | "sibling" | "spouse";
};

const CARD_WIDTH = 165;
const LATERAL_CARD_WIDTH = 145;

export default function ExploreScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [peopleResponse, relationshipsResponse] = await Promise.all([
        fetch(`${API_URL}/people`),
        fetch(`${API_URL}/relationships`),
      ]);

      const peopleData: Person[] = await peopleResponse.json();
      const relationshipsData: Relationship[] =
        await relationshipsResponse.json();

      setPeople(peopleData);
      setRelationships(relationshipsData);

      if (peopleData.length > 0) {
        setSelectedPerson(peopleData[0]);
      }
    } catch (error) {
      console.log("Could not connect to the server:", error);
    }
  }

  if (!selectedPerson) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Family Tree</Text>
        <Text>Loading...</Text>
      </View>
    );
  }

  const parents = relationships
    .filter(
      (relationship) =>
        relationship.relationshipType === "parent" &&
        relationship.relatedPersonId === selectedPerson.id
    )
    .map((relationship) =>
      people.find((person) => person.id === relationship.personId)
    )
    .filter(Boolean) as Person[];

  const children = relationships
    .filter(
      (relationship) =>
        relationship.relationshipType === "parent" &&
        relationship.personId === selectedPerson.id
    )
    .map((relationship) =>
      people.find((person) => person.id === relationship.relatedPersonId)
    )
    .filter(Boolean) as Person[];

  const siblings = relationships
    .filter(
      (relationship) =>
        relationship.relationshipType === "sibling" &&
        (relationship.personId === selectedPerson.id ||
          relationship.relatedPersonId === selectedPerson.id)
    )
    .map((relationship) => {
      const otherId =
        relationship.personId === selectedPerson.id
          ? relationship.relatedPersonId
          : relationship.personId;

      return people.find((person) => person.id === otherId);
    })
    .filter(Boolean) as Person[];

  const spouses = relationships
    .filter(
      (relationship) =>
        relationship.relationshipType === "spouse" &&
        (relationship.personId === selectedPerson.id ||
          relationship.relatedPersonId === selectedPerson.id)
    )
    .map((relationship) => {
      const otherId =
        relationship.personId === selectedPerson.id
          ? relationship.relatedPersonId
          : relationship.personId;

      return people.find((person) => person.id === otherId);
    })
    .filter(Boolean) as Person[];

  const parentsAreSpouses =
    parents.length === 2 &&
    relationships.some(
      (relationship) =>
        relationship.relationshipType === "spouse" &&
        ((relationship.personId === parents[0].id &&
          relationship.relatedPersonId === parents[1].id) ||
          (relationship.personId === parents[1].id &&
            relationship.relatedPersonId === parents[0].id))
    );

  function PersonCard({
    person,
    label,
    selected = false,
    width = CARD_WIDTH,
  }: {
    person: Person;
    label: string;
    selected?: boolean;
    width?: number;
  }) {
    return (
      <Pressable
        style={[
          styles.personCard,
          { width },
          selected && styles.selectedCard,
        ]}
        onPress={() => setSelectedPerson(person)}
      >
        <Text style={styles.relationshipLabel}>{label}</Text>

        <Text style={styles.personName}>{person.name}</Text>
      </Pressable>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Family Tree</Text>

      <Text style={styles.instruction}>
        Tap a person to center the tree on them.
      </Text>

      {/* Parents */}
      {parents.length > 0 && (
        <View style={styles.parentsArea}>
          <View style={styles.parentsRow}>
            {parents.map((parent) => (
              <PersonCard
                key={parent.id}
                person={parent}
                label="Parent"
              />
            ))}
          </View>

          {parentsAreSpouses && (
            <View style={styles.spouseConnection}>
              <View style={styles.spouseLine} />

              <Text style={styles.spouseLabel}>spouse</Text>
            </View>
          )}

          <View style={styles.parentConnection}>
            {parents.length === 1 ? (
              <View style={styles.singleParentLine} />
            ) : (
              <>
                <View style={styles.leftParentLine} />
                <View style={styles.rightParentLine} />
              </>
            )}
          </View>
        </View>
      )}

      {/* Selected person and lateral relationships */}
      <View style={styles.relationshipRow}>
        <PersonCard
          person={selectedPerson}
          label="Selected person"
          selected
        />

        {siblings.map((sibling) => (
          <View
            key={`sibling-${sibling.id}`}
            style={styles.lateralItem}
          >
            <View style={styles.horizontalLine} />

            <PersonCard
              person={sibling}
              label="Sibling"
              width={LATERAL_CARD_WIDTH}
            />
          </View>
        ))}

        {spouses.map((spouse) => (
          <View
            key={`spouse-${spouse.id}`}
            style={styles.lateralItem}
          >
            <View style={styles.horizontalLine} />

            <PersonCard
              person={spouse}
              label="Spouse"
              width={LATERAL_CARD_WIDTH}
            />
          </View>
        ))}
      </View>

      {/* Children */}
      {children.length > 0 && (
        <View style={styles.childrenArea}>
          <View style={styles.childLine} />

          <View style={styles.childrenRow}>
            {children.map((child) => (
              <PersonCard
                key={child.id}
                person={child}
                label="Child"
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#fff",
  },

  container: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 80,
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 12,
  },

  instruction: {
    fontSize: 17,
    color: "#666",
    alignSelf: "flex-start",
    marginBottom: 40,
  },

  personCard: {
    width: CARD_WIDTH,
    minHeight: 120,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  selectedCard: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },

  relationshipLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },

  personName: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },

  parentsArea: {
    width: "100%",
    alignItems: "center",
  },

  parentsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  spouseConnection: {
    width: CARD_WIDTH * 2 + 12,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  spouseLine: {
    position: "absolute",
    width: CARD_WIDTH * 2 + 12,
    height: 2,
    backgroundColor: "#999",
  },

  spouseLabel: {
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    fontSize: 13,
    color: "#666",
  },

  parentConnection: {
    width: CARD_WIDTH * 2 + 12,
    height: 65,
    position: "relative",
  },

  singleParentLine: {
    position: "absolute",
    width: 2,
    height: 65,
    backgroundColor: "#999",
    left: "50%",
    top: 0,
  },

  leftParentLine: {
    position: "absolute",
    width: 2,
    height: 75,
    backgroundColor: "#999",
    left: CARD_WIDTH / 2,
    top: -5,
    transform: [{ rotate: "-32deg" }],
  },

  rightParentLine: {
    position: "absolute",
    width: 2,
    height: 75,
    backgroundColor: "#999",
    right: CARD_WIDTH / 2,
    top: -5,
    transform: [{ rotate: "32deg" }],
  },

  relationshipRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  lateralItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  horizontalLine: {
    width: 24,
    height: 2,
    backgroundColor: "#999",
  },

  childrenArea: {
    alignItems: "center",
  },

  childLine: {
    width: 2,
    height: 45,
    backgroundColor: "#999",
  },

  childrenRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
});