package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.domain.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface JpaUserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "profileImage")
    Optional<User> findByUsername(String username);

    @EntityGraph(attributePaths = "profileImage")
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = "profileImage")
    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
