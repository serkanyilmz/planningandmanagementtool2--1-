package com.ser.ps.application.ports.out;

import com.ser.ps.domain.model.Label;
import java.util.Optional;

public interface LabelRepositoryPort {

    Label save(Label label);

    Optional<Label> findById(Long id);

    void delete(Label label);
}
