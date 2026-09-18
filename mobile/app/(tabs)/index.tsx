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
  sex: string | null;
  dateOfBirth: string | null;
  isAlive: boolean;
};

type Relationship = {
  id: number;
  personId: number;
  relatedPersonId: number;
  relationshipType: "parent" | "sibling" | "spouse";
};

type RelationshipResult = {
  person: {
    id: number;
    name: string;
  };
  relatedPerson: {
    id: number;
    name: string;
  };
  relationship: string | null;
  path: {
    id: number;
    name: string;
  }[];
  message?: string;
};

const relationshipTypes = ["parent", "sibling", "spouse"] as const;

export default function HomeScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonSex, setNewPersonSex] = useState("");
  const [newPersonDateOfBirth, setNewPersonDateOfBirth] = useState("");
  const [newPersonIsAlive, setNewPersonIsAlive] = useState(true);

  const [editingPerson, setEditingPerson] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSex, setEditSex] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editIsAlive, setEditIsAlive] = useState(true);

  const [relationshipPersonId, setRelationshipPersonId] =
    useState<number | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<Relationship["relationshipType"]>("parent");
  const [relatedPersonId, setRelatedPersonId] = useState<number | null>(null);

  const [editingRelationshipId, setEditingRelationshipId] =
    useState<number | null>(null);
  const [editRelationshipPersonId, setEditRelationshipPersonId] =
    useState<number | null>(null);
  const [editRelationshipType, setEditRelationshipType] =
    useState<Relationship["relationshipType"]>("parent");
  const [editRelatedPersonId, setEditRelatedPersonId] =
    useState<number | null>(null);

  const [relationshipFromId, setRelationshipFromId] =
    useState<number | null>(null);
  const [relationshipToId, setRelationshipToId] =
    useState<number | null>(null);
  const [relationshipResult, setRelationshipResult] =
    useState<RelationshipResult | null>(null);
  const [findingRelationship, setFindingRelationship] = useState(false);

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
          sex: newPersonSex.trim() || null,
          dateOfBirth: newPersonDateOfBirth.trim() || null,
          isAlive: newPersonIsAlive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add person");
      }

      const newPerson = await response.json();

      setPeople((currentPeople) => [...currentPeople, newPerson]);

      setNewPersonName("");
      setNewPersonSex("");
      setNewPersonDateOfBirth("");
      setNewPersonIsAlive(true);
    } catch (error) {
      console.log("Could not add person:", error);
    }
  };

  const startEditingPerson = () => {
    if (!selectedPerson) {
      return;
    }

    setEditName(selectedPerson.name);
    setEditSex(selectedPerson.sex || "");
    setEditDateOfBirth(selectedPerson.dateOfBirth || "");
    setEditIsAlive(selectedPerson.isAlive);
    setEditingPerson(true);
  };

  const updatePerson = async () => {
    if (!selectedPerson || !editName.trim()) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/people/${selectedPerson.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          sex: editSex.trim() || null,
          dateOfBirth: editDateOfBirth.trim() || null,
          isAlive: editIsAlive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update person");
      }

      const updatedPerson = await response.json();

      setPeople((currentPeople) =>
        currentPeople.map((person) =>
          person.id === updatedPerson.id ? updatedPerson : person
        )
      );

      setSelectedPerson(updatedPerson);
      setEditingPerson(false);
    } catch (error) {
      console.log("Could not update person:", error);
    }
  };

  const deletePerson = async () => {
    if (!selectedPerson) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/people/${selectedPerson.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete person");
      }

      setPeople((currentPeople) =>
        currentPeople.filter((person) => person.id !== selectedPerson.id)
      );

      setRelationships((currentRelationships) =>
        currentRelationships.filter(
          (relationship) =>
            relationship.personId !== selectedPerson.id &&
            relationship.relatedPersonId !== selectedPerson.id
        )
      );

      setSelectedPerson(null);
    } catch (error) {
      console.log("Could not delete person:", error);
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

  const startEditingRelationship = (relationship: Relationship) => {
    setEditingRelationshipId(relationship.id);
    setEditRelationshipPersonId(relationship.personId);
    setEditRelationshipType(relationship.relationshipType);
    setEditRelatedPersonId(relationship.relatedPersonId);
  };

  const cancelEditingRelationship = () => {
    setEditingRelationshipId(null);
    setEditRelationshipPersonId(null);
    setEditRelationshipType("parent");
    setEditRelatedPersonId(null);
  };

  const updateRelationship = async () => {
    if (
      !editingRelationshipId ||
      !editRelationshipPersonId ||
      !editRelatedPersonId
    ) {
      return;
    }

    if (editRelationshipPersonId === editRelatedPersonId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/relationships/${editingRelationshipId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personId: editRelationshipPersonId,
            relatedPersonId: editRelatedPersonId,
            relationshipType: editRelationshipType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update relationship");
      }

      const updatedRelationship = await response.json();

      setRelationships((currentRelationships) =>
        currentRelationships.map((relationship) =>
          relationship.id === updatedRelationship.id
            ? updatedRelationship
            : relationship
        )
      );

      cancelEditingRelationship();
    } catch (error) {
      console.log("Could not update relationship:", error);
    }
  };

  const deleteRelationship = async (relationshipId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/relationships/${relationshipId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete relationship");
      }

      setRelationships((currentRelationships) =>
        currentRelationships.filter(
          (relationship) => relationship.id !== relationshipId
        )
      );

      if (editingRelationshipId === relationshipId) {
        cancelEditingRelationship();
      }
    } catch (error) {
      console.log("Could not delete relationship:", error);
    }
  };

  const findRelationship = async () => {
    if (!relationshipFromId || !relationshipToId) {
      return;
    }

    if (relationshipFromId === relationshipToId) {
      return;
    }

    setFindingRelationship(true);
    setRelationshipResult(null);

    try {
      const response = await fetch(
        `${API_URL}/relationships/between/${relationshipFromId}/${relationshipToId}`
      );

      if (!response.ok) {
        throw new Error("Failed to find relationship");
      }

      const result = await response.json();
      setRelationshipResult(result);
    } catch (error) {
      console.log("Could not find relationship:", error);
    } finally {
      setFindingRelationship(false);
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

          <Text style={styles.sectionTitle}>Find Relationship</Text>

          <Text style={styles.label}>Person</Text>

          {people.map((person) => (
            <Pressable
              key={`relationship-from-${person.id}`}
              style={[
                styles.optionButton,
                relationshipFromId === person.id && styles.selectedOption,
              ]}
              onPress={() => {
                setRelationshipFromId(person.id);
                setRelationshipResult(null);
              }}
            >
              <Text style={styles.optionText}>{person.name}</Text>
            </Pressable>
          ))}

          <Text style={styles.label}>Related person</Text>

          {people.map((person) => (
            <Pressable
              key={`relationship-to-${person.id}`}
              style={[
                styles.optionButton,
                relationshipToId === person.id && styles.selectedOption,
              ]}
              onPress={() => {
                setRelationshipToId(person.id);
                setRelationshipResult(null);
              }}
            >
              <Text style={styles.optionText}>{person.name}</Text>
            </Pressable>
          ))}

          <Pressable
            style={styles.addButton}
            onPress={findRelationship}
            disabled={findingRelationship}
          >
            <Text style={styles.addButtonText}>
              {findingRelationship
                ? "Finding..."
                : "Find Relationship"}
            </Text>
          </Pressable>

          {relationshipResult && (
            <View style={styles.relationshipResult}>
              {relationshipResult.relationship ? (
                <>
                  <Text style={styles.resultLabel}>Relationship</Text>

                  <Text style={styles.resultRelationship}>
                    {relationshipResult.relationship}
                  </Text>
                </>
              ) : (
                <Text style={styles.resultRelationship}>
                  Relationship could not be determined
                </Text>
              )}

              {relationshipResult.path.length > 0 && (
                <>
                  <Text style={styles.resultLabel}>Connection path</Text>

                  {relationshipResult.path.map((person, index) => (
                    <View key={person.id} style={styles.pathItem}>
                      <Text style={styles.pathName}>{person.name}</Text>

                      {index < relationshipResult.path.length - 1 && (
                        <Text style={styles.pathArrow}>↓</Text>
                      )}
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Add Person</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={newPersonName}
            onChangeText={setNewPersonName}
          />

          <TextInput
            style={styles.input}
            placeholder="Sex"
            value={newPersonSex}
            onChangeText={setNewPersonSex}
          />

          <TextInput
            style={styles.input}
            placeholder="Date of birth (YYYY-MM-DD)"
            value={newPersonDateOfBirth}
            onChangeText={setNewPersonDateOfBirth}
          />

          <Text style={styles.label}>Status</Text>

          <View style={styles.typeRow}>
            <Pressable
              style={[
                styles.typeButton,
                newPersonIsAlive && styles.selectedOption,
              ]}
              onPress={() => setNewPersonIsAlive(true)}
            >
              <Text style={styles.typeText}>Living</Text>
            </Pressable>

            <Pressable
              style={[
                styles.typeButton,
                !newPersonIsAlive && styles.selectedOption,
              ]}
              onPress={() => setNewPersonIsAlive(false)}
            >
              <Text style={styles.typeText}>Deceased</Text>
            </Pressable>
          </View>

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
          <Pressable
            onPress={() => {
              setSelectedPerson(null);
              setEditingPerson(false);
              cancelEditingRelationship();
            }}
          >
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          {!editingPerson ? (
            <>
              <Text style={styles.selectedName}>{selectedPerson.name}</Text>

              <Text style={styles.detail}>
                Sex: {selectedPerson.sex || "Not specified"}
              </Text>

              <Text style={styles.detail}>
                Date of birth:{" "}
                {selectedPerson.dateOfBirth || "Not specified"}
              </Text>

              <Text style={styles.detail}>
                Status: {selectedPerson.isAlive ? "Living" : "Deceased"}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={startEditingPerson}
                >
                  <Text style={styles.secondaryButtonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={deletePerson}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>

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

                if (editingRelationshipId === relationship.id) {
                  return (
                    <View
                      key={relationship.id}
                      style={styles.relationshipEdit}
                    >
                      <Text style={styles.label}>Person</Text>

                      {people.map((person) => (
                        <Pressable
                          key={`edit-person-${relationship.id}-${person.id}`}
                          style={[
                            styles.optionButton,
                            editRelationshipPersonId === person.id &&
                              styles.selectedOption,
                          ]}
                          onPress={() =>
                            setEditRelationshipPersonId(person.id)
                          }
                        >
                          <Text style={styles.optionText}>
                            {person.name}
                          </Text>
                        </Pressable>
                      ))}

                      <Text style={styles.label}>Relationship type</Text>

                      <View style={styles.typeRow}>
                        {relationshipTypes.map((relationshipType) => (
                          <Pressable
                            key={`edit-type-${relationship.id}-${relationshipType}`}
                            style={[
                              styles.typeButton,
                              editRelationshipType === relationshipType &&
                                styles.selectedOption,
                            ]}
                            onPress={() =>
                              setEditRelationshipType(relationshipType)
                            }
                          >
                            <Text style={styles.typeText}>
                              {relationshipType}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Text style={styles.label}>Related person</Text>

                      {people.map((person) => (
                        <Pressable
                          key={`edit-related-${relationship.id}-${person.id}`}
                          style={[
                            styles.optionButton,
                            editRelatedPersonId === person.id &&
                              styles.selectedOption,
                          ]}
                          onPress={() =>
                            setEditRelatedPersonId(person.id)
                          }
                        >
                          <Text style={styles.optionText}>
                            {person.name}
                          </Text>
                        </Pressable>
                      ))}

                      <Pressable
                        style={styles.addButton}
                        onPress={updateRelationship}
                      >
                        <Text style={styles.addButtonText}>
                          Save Relationship
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.cancelButton}
                        onPress={cancelEditingRelationship}
                      >
                        <Text style={styles.cancelButtonText}>
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  );
                }

                return (
                  <View key={relationship.id} style={styles.relationship}>
                    <Pressable
                      onPress={() => setSelectedPerson(otherPerson)}
                    >
                      <Text style={styles.relationshipType}>{type}</Text>
                      <Text style={styles.otherPerson}>
                        {otherPerson.name}
                      </Text>
                    </Pressable>

                    <View style={styles.relationshipActions}>
                      <Pressable
                        style={styles.smallButton}
                        onPress={() =>
                          startEditingRelationship(relationship)
                        }
                      >
                        <Text style={styles.smallButtonText}>Edit</Text>
                      </Pressable>

                      <Pressable
                        style={styles.smallDeleteButton}
                        onPress={() =>
                          deleteRelationship(relationship.id)
                        }
                      >
                        <Text style={styles.smallDeleteButtonText}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Edit Person</Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editName}
                onChangeText={setEditName}
              />

              <TextInput
                style={styles.input}
                placeholder="Sex"
                value={editSex}
                onChangeText={setEditSex}
              />

              <TextInput
                style={styles.input}
                placeholder="Date of birth (YYYY-MM-DD)"
                value={editDateOfBirth}
                onChangeText={setEditDateOfBirth}
              />

              <Text style={styles.label}>Status</Text>

              <View style={styles.typeRow}>
                <Pressable
                  style={[
                    styles.typeButton,
                    editIsAlive && styles.selectedOption,
                  ]}
                  onPress={() => setEditIsAlive(true)}
                >
                  <Text style={styles.typeText}>Living</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    !editIsAlive && styles.selectedOption,
                  ]}
                  onPress={() => setEditIsAlive(false)}
                >
                  <Text style={styles.typeText}>Deceased</Text>
                </Pressable>
              </View>

              <Pressable style={styles.addButton} onPress={updatePerson}>
                <Text style={styles.addButtonText}>Save Changes</Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => setEditingPerson(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </>
          )}
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
    marginBottom: 16,
  },
  detail: {
    fontSize: 17,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    marginBottom: 32,
  },
  secondaryButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 17,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 17,
  },
  relationship: {
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  relationshipActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
  },
  smallButtonText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
  },
  smallDeleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 8,
  },
  smallDeleteButtonText: {
    color: "#FF3B30",
    fontSize: 15,
    fontWeight: "600",
  },
  relationshipEdit: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  relationshipResult: {
    padding: 18,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  resultRelationship: {
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 18,
  },
  pathItem: {
    alignItems: "center",
  },
  pathName: {
    fontSize: 18,
    fontWeight: "500",
  },
  pathArrow: {
    fontSize: 20,
    marginVertical: 3,
  },
});