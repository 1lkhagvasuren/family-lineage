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

  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR FAMILY</Text>
        <Text style={styles.title}>Family Lineage</Text>
        <Text style={styles.headerDescription}>
          Explore and manage your family connections.
        </Text>
      </View>

      {!selectedPerson ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.subtitle}>People</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{people.length}</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor="#9A9A9A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Text style={styles.clearSearch}>×</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.peopleList}>
            {filteredPeople.map((person) => (
              <Pressable
                key={person.id}
                style={({ pressed }) => [
                  styles.personCard,
                  pressed && styles.pressedCard,
                ]}
                onPress={() => setSelectedPerson(person)}
              >
                <View style={styles.personAvatar}>
                  <Text style={styles.personAvatarText}>
                    {person.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.personCardContent}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personStatus}>
                    {person.isAlive ? "Living" : "Deceased"}
                  </Text>
                </View>

                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}

            {filteredPeople.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No people found</Text>
                <Text style={styles.emptyText}>
                  Try a different name.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <View>
                <Text style={styles.featureEyebrow}>EXPLORE</Text>
                <Text style={styles.featureTitle}>Find Relationship</Text>
              </View>

              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>⌁</Text>
              </View>
            </View>

            <Text style={styles.featureDescription}>
              Discover how two family members are connected.
            </Text>

            <Text style={styles.label}>Person</Text>

            {people.map((person) => (
              <Pressable
                key={`relationship-from-${person.id}`}
                style={[
                  styles.optionButton,
                  relationshipFromId === person.id &&
                    styles.selectedOption,
                ]}
                onPress={() => {
                  setRelationshipFromId(person.id);
                  setRelationshipResult(null);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    relationshipFromId === person.id &&
                      styles.selectedOptionText,
                  ]}
                >
                  {person.name}
                </Text>
              </Pressable>
            ))}

            <Text style={styles.label}>Related person</Text>

            {people.map((person) => (
              <Pressable
                key={`relationship-to-${person.id}`}
                style={[
                  styles.optionButton,
                  relationshipToId === person.id &&
                    styles.selectedOption,
                ]}
                onPress={() => {
                  setRelationshipToId(person.id);
                  setRelationshipResult(null);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    relationshipToId === person.id &&
                      styles.selectedOptionText,
                  ]}
                >
                  {person.name}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressedButton,
              ]}
              onPress={findRelationship}
              disabled={findingRelationship}
            >
              <Text style={styles.primaryButtonText}>
                {findingRelationship
                  ? "Finding..."
                  : "Find Relationship"}
              </Text>
            </Pressable>

            {relationshipResult && (
              <View style={styles.relationshipResult}>
                {relationshipResult.relationship ? (
                  <>
                    <Text style={styles.resultLabel}>RELATIONSHIP</Text>

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
                    <Text style={styles.resultLabel}>CONNECTION PATH</Text>

                    <View style={styles.pathContainer}>
                      {relationshipResult.path.map((person, index) => (
                        <View key={person.id} style={styles.pathItem}>
                          <View style={styles.pathDot}>
                            <Text style={styles.pathDotText}>
                              {person.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          <Text style={styles.pathName}>
                            {person.name}
                          </Text>

                          {index <
                            relationshipResult.path.length - 1 && (
                            <Text style={styles.pathArrow}>↓</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Add Person</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#9A9A9A"
              value={newPersonName}
              onChangeText={setNewPersonName}
            />

            <Text style={styles.label}>Sex</Text>
            <TextInput
              style={styles.input}
              placeholder="Male or female"
              placeholderTextColor="#9A9A9A"
              value={newPersonSex}
              onChangeText={setNewPersonSex}
            />

            <Text style={styles.label}>Date of birth</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9A9A9A"
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
                <Text
                  style={[
                    styles.typeText,
                    newPersonIsAlive && styles.selectedOptionText,
                  ]}
                >
                  Living
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeButton,
                  !newPersonIsAlive && styles.selectedOption,
                ]}
                onPress={() => setNewPersonIsAlive(false)}
              >
                <Text
                  style={[
                    styles.typeText,
                    !newPersonIsAlive && styles.selectedOptionText,
                  ]}
                >
                  Deceased
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressedButton,
              ]}
              onPress={addPerson}
            >
              <Text style={styles.primaryButtonText}>Add Person</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
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
                <Text
                  style={[
                    styles.optionText,
                    relationshipPersonId === person.id &&
                      styles.selectedOptionText,
                  ]}
                >
                  {person.name}
                </Text>
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
                  <Text
                    style={[
                      styles.typeText,
                      relationshipType === type &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Related person</Text>

            {people.map((person) => (
              <Pressable
                key={`related-person-${person.id}`}
                style={[
                  styles.optionButton,
                  relatedPersonId === person.id &&
                    styles.selectedOption,
                ]}
                onPress={() => setRelatedPersonId(person.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    relatedPersonId === person.id &&
                      styles.selectedOptionText,
                  ]}
                >
                  {person.name}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressedButton,
              ]}
              onPress={addRelationship}
            >
              <Text style={styles.primaryButtonText}>
                Add Relationship
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setSelectedPerson(null);
              setEditingPerson(false);
              cancelEditingRelationship();
            }}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>People</Text>
          </Pressable>

          {!editingPerson ? (
            <>
              <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {selectedPerson.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.selectedName}>
                  {selectedPerson.name}
                </Text>

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusBadgeText}>
                    {selectedPerson.isAlive ? "Living" : "Deceased"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.cardHeading}>Personal Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sex</Text>
                  <Text style={styles.detailValue}>
                    {selectedPerson.sex || "Not specified"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date of birth</Text>
                  <Text style={styles.detailValue}>
                    {selectedPerson.dateOfBirth || "Not specified"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {selectedPerson.isAlive ? "Living" : "Deceased"}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.outlineButton,
                    pressed && styles.pressedOutlineButton,
                  ]}
                  onPress={startEditingPerson}
                >
                  <Text style={styles.outlineButtonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.pressedDangerButton,
                  ]}
                  onPress={deletePerson}
                >
                  <Text style={styles.dangerButtonText}>Delete</Text>
                </Pressable>
              </View>

              <Text style={styles.subtitle}>Relationships</Text>

              {selectedRelationships.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    No relationships
                  </Text>
                  <Text style={styles.emptyText}>
                    No family connections have been added yet.
                  </Text>
                </View>
              )}

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
                      style={styles.relationshipEditCard}
                    >
                      <Text style={styles.cardHeading}>
                        Edit Relationship
                      </Text>

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
                          <Text
                            style={[
                              styles.optionText,
                              editRelationshipPersonId === person.id &&
                                styles.selectedOptionText,
                            ]}
                          >
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
                              editRelationshipType ===
                                relationshipType &&
                                styles.selectedOption,
                            ]}
                            onPress={() =>
                              setEditRelationshipType(relationshipType)
                            }
                          >
                            <Text
                              style={[
                                styles.typeText,
                                editRelationshipType ===
                                  relationshipType &&
                                  styles.selectedOptionText,
                              ]}
                            >
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
                          <Text
                            style={[
                              styles.optionText,
                              editRelatedPersonId === person.id &&
                                styles.selectedOptionText,
                            ]}
                          >
                            {person.name}
                          </Text>
                        </Pressable>
                      ))}

                      <Pressable
                        style={styles.primaryButton}
                        onPress={updateRelationship}
                      >
                        <Text style={styles.primaryButtonText}>
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
                  <View key={relationship.id} style={styles.relationshipCard}>
                    <Pressable
                      style={styles.relationshipMain}
                      onPress={() => setSelectedPerson(otherPerson)}
                    >
                      <View style={styles.relationshipAvatar}>
                        <Text style={styles.relationshipAvatarText}>
                          {otherPerson.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View>
                        <Text style={styles.relationshipType}>
                          {type}
                        </Text>
                        <Text style={styles.otherPerson}>
                          {otherPerson.name}
                        </Text>
                      </View>
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
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Edit Person</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor="#9A9A9A"
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.label}>Sex</Text>
              <TextInput
                style={styles.input}
                placeholder="Male or female"
                placeholderTextColor="#9A9A9A"
                value={editSex}
                onChangeText={setEditSex}
              />

              <Text style={styles.label}>Date of birth</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9A9A9A"
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
                  <Text
                    style={[
                      styles.typeText,
                      editIsAlive && styles.selectedOptionText,
                    ]}
                  >
                    Living
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    !editIsAlive && styles.selectedOption,
                  ]}
                  onPress={() => setEditIsAlive(false)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      !editIsAlive && styles.selectedOptionText,
                    ]}
                  >
                    Deceased
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={updatePerson}
              >
                <Text style={styles.primaryButtonText}>
                  Save Changes
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => setEditingPerson(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 48,
  },

  header: {
    marginBottom: 28,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "#8C7A6B",
    marginBottom: 6,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#302A26",
    marginBottom: 8,
  },

  headerDescription: {
    fontSize: 16,
    lineHeight: 23,
    color: "#776F69",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#302A26",
  },

  countBadge: {
    marginLeft: 9,
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#E9DED3",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6D5849",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E1DB",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  searchIcon: {
    fontSize: 26,
    color: "#8F8177",
    marginRight: 8,
    transform: [{ rotate: "-20deg" }],
  },

  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#302A26",
  },

  clearSearch: {
    fontSize: 25,
    color: "#8F8177",
    paddingLeft: 8,
  },

  peopleList: {
    marginBottom: 8,
  },

  personCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE4DE",
    borderRadius: 18,
    padding: 13,
    marginBottom: 9,
  },

  pressedCard: {
    opacity: 0.72,
  },

  personAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E8DCCF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  personAvatarText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#665142",
  },

  personCardContent: {
    flex: 1,
  },

  personName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#302A26",
    marginBottom: 3,
  },

  personStatus: {
    fontSize: 13,
    color: "#8A817B",
  },

  chevron: {
    fontSize: 29,
    color: "#B1A69E",
    marginLeft: 8,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE4DE",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#4B433E",
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 14,
    color: "#8A817B",
    textAlign: "center",
  },

  featureCard: {
    backgroundColor: "#F1EAE2",
    borderWidth: 1,
    borderColor: "#E4D8CD",
    borderRadius: 22,
    padding: 18,
    marginTop: 22,
    marginBottom: 16,
  },

  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  featureEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "#90725E",
    marginBottom: 5,
  },

  featureTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#332B26",
  },

  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E2D3C5",
    alignItems: "center",
    justifyContent: "center",
  },

  featureIconText: {
    fontSize: 28,
    color: "#735B49",
  },

  featureDescription: {
    fontSize: 15,
    lineHeight: 21,
    color: "#766A62",
    marginTop: 10,
    marginBottom: 4,
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE4DE",
    borderRadius: 22,
    padding: 18,
    marginTop: 16,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#302A26",
    marginBottom: 5,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#655C56",
    marginTop: 15,
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DED6CF",
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#302A26",
    backgroundColor: "#FCFBFA",
  },

  optionButton: {
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#E1DAD4",
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#FFFFFF",
  },

  selectedOption: {
    borderColor: "#B79578",
    backgroundColor: "#EDE1D5",
  },

  optionText: {
    fontSize: 15,
    color: "#4A423D",
  },

  selectedOptionText: {
    color: "#604936",
    fontWeight: "600",
  },

  typeRow: {
    flexDirection: "row",
    gap: 8,
  },

  typeButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#DED6CF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  typeText: {
    fontSize: 15,
    color: "#5C544E",
    textTransform: "capitalize",
  },

  primaryButton: {
    backgroundColor: "#765C49",
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  pressedButton: {
    opacity: 0.75,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  relationshipResult: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCCFC3",
    borderRadius: 17,
    padding: 16,
    marginTop: 16,
  },

  resultLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#907B6A",
    marginBottom: 5,
  },

  resultRelationship: {
    fontSize: 26,
    fontWeight: "700",
    color: "#49382D",
    textTransform: "capitalize",
    marginBottom: 16,
  },

  pathContainer: {
    marginTop: 2,
  },

  pathItem: {
    alignItems: "center",
  },

  pathDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8DCD0",
    alignItems: "center",
    justifyContent: "center",
  },

  pathDotText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#665142",
  },

  pathName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A413B",
    marginTop: 4,
  },

  pathArrow: {
    fontSize: 18,
    color: "#A08E80",
    marginVertical: 2,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  backArrow: {
    fontSize: 32,
    color: "#765C49",
    marginRight: 5,
    lineHeight: 30,
  },

  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#765C49",
  },

  profileCard: {
    backgroundColor: "#EFE6DE",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
  },

  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DCC7B6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  profileAvatarText: {
    fontSize: 31,
    fontWeight: "700",
    color: "#624B3B",
  },

  selectedName: {
    fontSize: 29,
    fontWeight: "700",
    color: "#302A26",
    marginBottom: 9,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: "#E5D9CE",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#71826B",
    marginRight: 6,
  },

  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#63574E",
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE4DE",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },

  cardHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A332E",
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECE8",
  },

  detailLabel: {
    fontSize: 15,
    color: "#827870",
  },

  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#403934",
    maxWidth: "55%",
    textAlign: "right",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },

  outlineButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#B79578",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  pressedOutlineButton: {
    backgroundColor: "#F1E8DF",
  },

  outlineButtonText: {
    color: "#765C49",
    fontSize: 16,
    fontWeight: "700",
  },

  dangerButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D4AAA3",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDFC",
  },

  pressedDangerButton: {
    backgroundColor: "#F8EDEA",
  },

  dangerButtonText: {
    color: "#9A625A",
    fontSize: 16,
    fontWeight: "700",
  },

  relationshipCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE4DE",
    borderRadius: 18,
    padding: 14,
    marginBottom: 9,
  },

  relationshipMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  relationshipAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#E9DED3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  relationshipAvatarText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#665142",
  },

  relationshipType: {
    fontSize: 12,
    fontWeight: "700",
    color: "#927966",
    textTransform: "capitalize",
    marginBottom: 2,
  },

  otherPerson: {
    fontSize: 19,
    fontWeight: "600",
    color: "#39322D",
  },

  relationshipActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#B79578",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  smallButtonText: {
    color: "#765C49",
    fontSize: 14,
    fontWeight: "600",
  },

  smallDeleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#D4AAA3",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  smallDeleteButtonText: {
    color: "#9A625A",
    fontSize: 14,
    fontWeight: "600",
  },

  relationshipEditCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCCFC3",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },

  cancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#766C65",
  },
});