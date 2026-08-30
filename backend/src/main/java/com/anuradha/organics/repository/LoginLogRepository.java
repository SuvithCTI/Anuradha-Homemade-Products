package com.anuradha.organics.repository;

import com.anuradha.organics.entity.LoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoginLogRepository extends JpaRepository<LoginLog, Long> {
    List<LoginLog> findByEmailOrderByLoginTimeDesc(String email);
    List<LoginLog> findAllByOrderByLoginTimeDesc();
    void deleteByUserId(Long userId);
    void deleteByEmail(String email);
}
