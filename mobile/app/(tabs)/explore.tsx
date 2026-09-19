import { useEffect, useState } from "react";
import {
  Dimensions,
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

const CARD_WIDTH = 138;
const LATERAL_CARD_WIDTH = 118;
const SCREEN_WIDTH = Dimensions.get("window").width;

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
        <Text style={styles.loadingText}>Loading...</Text>
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
        <View style={[styles.avatar, selected && styles.selectedAvatar]}>
          <Text style={styles.avatarText}>
            {person.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text
          style={[
            styles.relationshipLabel,
            selected && styles.selectedRelationshipLabel,
          ]}
        >
          {label}
        </Text>

        <Text style={styles.personName}>{person.name}</Text>
      </Pressable>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Family Tree</Text>

      <Text style={styles.instruction}>
        Tap a person to center the tree on them.
      </Text>

      <ScrollView
        horizontal
        style={styles.horizontalScroll}
        contentContainerStyle={styles.treeContent}
        showsHorizontalScrollIndicator={true}
      >
        <View style={styles.tree}>
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
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },

  loadingContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#F8F7F4",
  },

  container: {
    paddingTop: 80,
    paddingBottom: 80,
    minWidth: SCREEN_WIDTH,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#332C27",
    marginHorizontal: 24,
    marginBottom: 10,
  },

  instruction: {
    fontSize: 16,
    color: "#81766D",
    marginHorizontal: 24,
    marginBottom: 32,
  },

  loadingText: {
    fontSize: 16,
    color: "#81766D",
  },

  horizontalScroll: {
    width: "100%",
  },

  treeContent: {
    minWidth: SCREEN_WIDTH,
    alignItems: "center",
    paddingHorizontal: 18,
  },

  tree: {
    alignItems: "center",
  },

  personCard: {
    width: CARD_WIDTH,
    minHeight: 112,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E2D9D0",
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDFC",
    shadowColor: "#5B4636",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },

  selectedCard: {
    borderColor: "#765C49",
    borderWidth: 2,
    backgroundColor: "#F1EAE2",
    shadowOpacity: 0.12,
  },

  avatar: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#E9DED3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  selectedAvatar: {
    backgroundColor: "#765C49",
  },

  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#765C49",
  },

  relationshipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9A8D83",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  selectedRelationshipLabel: {
    color: "#765C49",
  },

  personName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#332C27",
    textAlign: "center",
  },

  parentsArea: {
    alignItems: "center",
  },

  parentsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 9,
  },

  spouseConnection: {
    width: CARD_WIDTH * 2 + 9,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  spouseLine: {
    position: "absolute",
    width: CARD_WIDTH * 2 + 9,
    height: 2,
    backgroundColor: "#C8B8AA",
  },

  spouseLabel: {
    backgroundColor: "#F8F7F4",
    paddingHorizontal: 7,
    fontSize: 10,
    fontWeight: "600",
    color: "#8B796B",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  parentConnection: {
    width: CARD_WIDTH * 2 + 9,
    height: 50,
    position: "relative",
  },

  singleParentLine: {
    position: "absolute",
    width: 2,
    height: 50,
    backgroundColor: "#C8B8AA",
    left: "50%",
    top: 0,
  },

  leftParentLine: {
    position: "absolute",
    width: 2,
    height: 60,
    backgroundColor: "#C8B8AA",
    left: CARD_WIDTH / 2,
    top: -5,
    transform: [{ rotate: "-32deg" }],
  },

  rightParentLine: {
    position: "absolute",
    width: 2,
    height: 60,
    backgroundColor: "#C8B8AA",
    right: CARD_WIDTH / 2,
    top: -5,
    transform: [{ rotate: "32deg" }],
  },

  relationshipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  lateralItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },

  horizontalLine: {
    width: 16,
    height: 2,
    backgroundColor: "#C8B8AA",
  },

  childrenArea: {
    alignItems: "center",
  },

  childLine: {
    width: 2,
    height: 34,
    backgroundColor: "#C8B8AA",
  },

  childrenRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 9,
  },
});